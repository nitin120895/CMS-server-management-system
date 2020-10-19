const express=require('express');
const router=express.Router();


const mysql = require('mysql');

//connect database
const con = mysql.createConnection({
    user: "root",
    password: "root",
    port: "3306",
    host: "localhost",
    database: 'cmsdb'
}, (err, result) => {
    if (err)
        throw err;
    else
        console.log(result);
})


router.get('/', (req, res) => {

    res.render('login')
})




// ///////////api's
//admin login
router.get('/logincheck', (req, res) => {
    let email = req.query.email
    let password = req.query.password
    var sql = "select * from adminlogin where email=? and password=?"
    let values = [email, password]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        if (err)
      throw err;
        else if (result.length >0) {
            res.json({ msg: "login successfully...."})

        }
        else {
            res.json({ msg: "login fail pls right email and password" })
        }

    })
})





module.exports=router;
