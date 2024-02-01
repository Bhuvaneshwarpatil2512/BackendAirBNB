

// const db = async () => {
//   try {
//     await mongoose.connect(process.env.URL);
//     console.log("sucessfully connect");
//   } catch (error) {
//     console.log(error);
//   }
// };

// const db = async() =>{
//   try {
//     await mongoose.connect(process.env.URI, {
//       useNewUrlParser: true,
//       useCreateIndex: true,
//     }, (err) => {
//       if (!err) {
//           console.log('MongoDB Connection Succeeded.')
//       } else {
//           console.log('Error in DB connection: ' + err)
//       }
//     })
//   } catch (error) {
//     console.log(error);
//   }
// }

const { mongoose } = require("mongoose");

const db = async () => {
  try {
    await mongoose.connect(process.env.URL);
    
    console.log("sucessfully connect");
  } catch (error) {
    console.log(error);
  }
};

module.exports = db;