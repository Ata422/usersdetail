const mongoose = require("mongoose");
const { Schema } = mongoose;

const useridSchema = new Schema({
  id: {
    type: String,
  },
  seq: {
    type: Number,
  },
});

module.exports = mongoose.model("userid", useridSchema);
