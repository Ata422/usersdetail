const express = require("express");
const User = require("../models/User");
const id = require("../models/Userid");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "habibisagoodb#oy";
const fetchuser = require("../midleware/fetchuser");


// Route 1: create user using: api/auth/createuser
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "password must be at least 5 char long").isLength({
      min: 5,
    }),
    body("phoneno", "Phone no must be at least 11 char long").isLength({
      min: 11,
    }),
  ],
  async (req, res) => {
    // model 2

    // model 1
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let user = await User.findOne({
        $or:[{ email: req.body.email},
        {phoneno: req.body.phoneno},
      ]
      });
      if (user) {
        if(user.email=== req.body.email && user.phoneno=== req.body.phoneno){
          return res
            .status(400)
            .json({
              success,
              error: "sorry a user with this email and number already exists",
            });
        }
        if(user.email=== req.body.email){
          return res
            .status(400)
            .json({
              success,
              error: "sorry a user with this email already exists",
            });
        }
        if(user.phoneno=== req.body.phoneno){
          return res
            .status(400)
            .json({
              success,
              error: "sorry a user with this number already exists",
            });
        }
      }
      const {name,email,password,cpassword,phoneno} = req.body
      if(password!==cpassword){
        return res.status(400).json({
          success,
          errors: "Password and confirm password do not match",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const secpass = await bcrypt.hash(password, salt);
      user = await User.create({
        name,
        email,
        password: secpass,
        phoneno,
        status: "y",
        user: null,
      });
      let cd = await id
        .findOneAndUpdate(
          { id: "autoval" },
          { $inc: { seq: 1 } },
          { new: true }
        )
        .exec();
      let seqId;
      if (cd == null) {
        const newval = new id({ id: "autoval", seq: 1 });
        await newval.save();
        seqId = 1;
      } else {
        seqId = cd.seq;
      }

      user.user = seqId;
      await user.save();
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      res.status(500).send("Internal error occured");
    }
  }
);

// Route 2: authenticate user using: api/auth/login
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "password cannot be blank").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        const success = false;
        return res
          .status(400)
          .json({
            success,
            errors: "please try to login with correct credentials",
          });
      }
      const comparepassword = await bcrypt.compare(password, user.password);
      if (!comparepassword) {
        const success = false;
        return res
          .status(400)
          .json({
            success,
            errors: "please try to login with correct credentials",
          });
      }

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      const success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("internal server Error");
    }
  }
);

// Route 3: Get logged user details using: api/auth/getuserd
router.get("/getuserd", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    res.send(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("internal server Error");
  }
});

// Route 4: Fetch all using: api/auth/getallusers/:id
router.get("/getallusers", async (req, res) => {
  try {
    const allusers = await User.find({ status: "y" });
    res.json(allusers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("internal server Error");
  }
});

// Route 5: Fetch all using: api/auth/getusersstatus
router.get("/getusersstatus", async (req, res) => {
  try {
    const allusers = await User.find({ status: "n" });
    res.json(allusers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("internal server Error");
  }
});

// Route 6: Update user details using: api/auth/getuser/:id
router.put("/getuser/:id", async (req, res) => {
  const { name, email, phoneno } = req.body;
  const newUser = {};
  if (name) {
    newUser.name = name;
  }
  if (email) {
    newUser.email = email;
  }
  if (phoneno) {
    newUser.phoneno = phoneno;
  }

  let user = await User.findById(req.params.id);
  if (!user) {
    return res.status(400).json("Not found");
  }

  user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: newUser },
    { new: true }
  );
  res.json([user]);
});

// Route 7: Delete user details using: api/auth/deleteuser/:id
router.delete("/deleteuser/:id", async (req, res) => {
  const newUser = {
    status: "n",
  };
  let user = await User.findById(req.params.id);
  if (!user) {
    return res.status(400).json("Not found");
  }

  user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: newUser },
    { new: true }
  );
  res.json([user]);
});

// Route 8: Delete user details using: api/auth/updatestatus/:id
router.put("/updatestatus/:id", async (req, res) => {
  const newUser = {
    status: "y",
  };
  let user = await User.findById(req.params.id);
  if (!user) {
    return res.status(400).json("Not found");
  }

  user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: newUser },
    { new: true }
  );
  res.json([user]);
});

// Route 9: Fetch all using: api/auth/getusers/:id
router.get("/getusers/:id", async (req, res) => {
  try {
    const allusers = await User.findById(req.params.id);
    res.json(allusers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("internal server Error");
  }
});

// Route 10: Update user details using: api/auth/updatepass/:id
router.put("/updatepass/:id", async (req, res) => {
  const { password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const secpass1 = await bcrypt.hash(password, salt);
  const newUser = {};
  if (password) {
    newUser.password = secpass1;
  }

  let user = await User.findById(req.params.id);
  if (!user) {
    return res.status(400).json("Not found");
  }

  user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: newUser },
    { new: true }
  );
  res.send({ user });
});
module.exports = router;
