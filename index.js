const express = require('express');
const axios = require('axios')
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

//mongodb+srv://Yash:<password>@cluster0.wbyudy1.mongodb.net/

//env is config
require('dotenv').config();
const app = express();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'fasefraw4r5r3wq45wdfgw34twdfg';

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
}));

mongoose.connect(process.env.URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));



function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get('/test', (req ,res) =>{
  mongoose.connect(process.env.URL)
    res.json('test ok');
});
                                                                                
//calling api for post registration
app.post('/register', async (req,res) => {
  mongoose.connect(process.env.URL)
  const {name,email,password} =req.body;
  //User stand for User file that is Schema pf Registration 
  try {
    const userDoc = await User.create({
      name,
      email,
      password:bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (error) {
    res.sendStatus(422).json(error);
  }
});
app.post('/login', async (req,res) => {
  mongoose.connect(process.env.URL)
  const {email,password} = req.body;
  const userDoc = await User.findOne({email});
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    // now in this step if password is ok then it will check for user Registration in Database and allow to log in
    if (passOk) {
      jwt.sign({
        email:userDoc.email,
        id:userDoc._id,
        //name:userDoc.name
      }, jwtSecret, {}, (error,token) => {
        if (error) throw error;
        res.cookie('token', token).json(userDoc);
      });
    } else {
      res.status(422).json('pass not ok');
    }
  } else {
    res.json('not found');
  }
});
app.get('/profile',(req,res)=>{
  const {token} = req.cookies
  if(token){
    jwt.verify(token, jwtSecret, {}, async(err, userData)=>{
      if(err) throw err;
      const {name,email,_id} = await User.findById(userData.id)
      res.json({name,email,_id});
    });
  }else{
    res.json(null);
  }
});

app.post(('/logout'), (req,res)=>{
   res.cookie('token','').json(true);
});

app.post('/upload-by-link', async (req, res) => {
  const { link } = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
  try {
    await imageDownloader.image({
      url: link,
      dest: __dirname + '/uploads/' + newName, // Add a forward slash here
    });
    res.json(newName);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

//uloading photos from --form
const photoMiddlware = multer({dest:'uploads/'});
app.post('/upload',photoMiddlware.array('photos', 100), async(res,req) =>{
  mongoose.connect(process.env.URL)
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const {path,originalname} = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath)
    uploadedFiles.push(newPath.replace('uploads/',''));
  }
  res.json(uploadedFiles);
});

app.post('/places', (req,res)=>{
  mongoose.connect(process.env.URL)
  const {token} = req.cookies;
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner:userData.id,price,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    });
    res.json(placeDoc);
  });
});

app.get('/user-places', (req,res) => {
  mongoose.connect(process.env.URL)
  const {token} = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const {id} = userData;
    res.json( await Place.find({owner:id}) );
  });
});

app.get('/places/:id', async (req,res) => {
  mongoose.connect(process.env.URL)
  const {id} = req.params;
  res.json(await Place.findById(id));
});

app.put('/places', async (req,res) => {
  mongoose.connect(process.env.URL)
  const {token} = req.cookies;
  const {
    id, title,address,addedPhotos,description,
    perks,extraInfo,checkIn,checkOut,maxGuests,price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,address,photos:addedPhotos,description,
        perks,extraInfo,checkIn,checkOut,maxGuests,price,
      });
      await placeDoc.save();
      res.json('ok');
    }
  });
});

app.get('/places', async(req,res)=>{
  res.json(await Place.find());
});

app.post('/bookings', async (req, res) => {
  mongoose.connect(process.env.URL)
  const userData = await getUserDataFromReq(req);
  const {
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
  } = req.body;
  Booking.create({
    place,checkIn,checkOut,numberOfGuests,name,phone,price,
    user:userData.id,
  }).then((doc) => {
    res.json(doc);
  }).catch((err) => {
    throw err;
  });
});

app.get('/bookings', async (req,res) => {
  mongoose.connect(process.env.URL)
  const userData = await getUserDataFromReq(req);
  res.json( await Booking.find({user:userData.id}).populate('place') );
});

app.listen(4000);