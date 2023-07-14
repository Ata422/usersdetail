const connectToMongo = require('./db')
connectToMongo()
const path = require('path')
const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
const BASEURL = process.env.BASE_URL

app.use(express.json())
app.use('/api/auth', require('./routes/auth'))

app.use(express.static(path.join(__dirname,'../build')))
app.get("*", function(req,res){
    res.sendFile(path.join(__dirname,'../build/index.html'))
})
app.listen(5000,()=>{
    console.log(`example app listing at ${BASEURL} `)
    
})