const express = require('express');
const app = express();
const path = require('path');
const hbs = require('express-handlebars');
const session = require('express-session');
const bodyparser = require('body-parser');
const nodemailer = require('nodemailer');

const mysql = require('mysql');
const PORT= process.env.PORT || 3000
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


////for images in hbs pages
app.use(express.static('views/images'));

// default engine
app.set('views', path.join(__dirname, 'views'))

app.set('view engine', 'hbs')

//config bodyparser
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({
    extended: true
}))

//server started

app.listen(PORT, () => {
    console.log("server started on port :"+PORT);
})


//config handlebars mainlayouts

app.engine('hbs', hbs({
    extname: "hbs",
    defaultLayout: "navbar",
    layoutsDir: __dirname + "/views/mainlayouts/"
}));


//define routes   from controller
const routes = require("./controllers/routes")
app.use('/api', routes)
//localhost:3000/api/

///nodemailer api

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nitinproject12@gmail.com',
        pass: 'gurjar@95'
    }
});

//config session
app.use(session({ secret: 'asjhjhjhghg' }))


app.get('/admin', (req, res) => {

    res.render('adminlogin')
})

app.get('/', (req, res) => {
    // let sql = "select * from accounts where  datediff(expirydate,curdate()) >=0 and datediff(expirydate,curdate()) <=7;";
    // con.query(sql, (err, result) => {
    //     console.log(result[0]);
    //     if (err)
    //         throw err
    //     else if (result.length != 0) {
    //         console.log(result[0].email);
    //         console.log(result[0].username);

    //         var mailOptions = {
    //             from: "nitinproject12@gmail.com",
    //             to: result[0].email,
    //             subject: "your server  expiry date is near",
    //             text: "HELLOW  MR.  " + result[0].username + " \nyour server expiry date  is near please do recharge for continue services for your website  \n  THANK YOU "
    //         }
    //         transporter.sendMail(mailOptions, (error, info) => {
    //             if (error)
    //                 throw error
    //             else
    //                 res.render('login')

    //         })

    //     }

    // })
    res.render('login')
})


app.get('/logout', (req, res) => {
    req.session.destroy()
    res.render('login', { msg: "logout succsesfull" })
})



// admin login
app.post('/logincheck', (req, res) => {
    let email = req.body.email;
    let password = req.body.password
    var sql = "select * from adminlogin where email=? and password=?"
    let values = [email, password]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;

        else if (result.length > 0) {
            req.session.user = email;
            res.render('home', { msg: "login successfully....", data: result[0], admin: req.session.user })

        }
        else {
            res.render('adminlogin', { msg: "login fail pls right email and password" })
        }

    })
})

//admin forget password///////////////


app.post('/forgetAdminPass', (req, res) => {
    let email = req.body.email;
    var sql = "select password from adminlogin where email=?"
    let values = [email]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        // console.log(result[0]);
        if (err)
            throw err;
        else if (result.length > 0) {
            var mailOptions = {
                from: "nitinproject12@gmail.com",
                to: email,
                subject: "forget password requeast ",
                text: " your password is-  " + result[0].password
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error)
                    throw error
                else
                    res.render('adminlogin', { msg: "password sent to your email ...please check your email." })

            })


        }
        else {
            res.render('adminlogin', { msg: " please enter right email..." })
        }

    })
})

///////////////////adminhome/////////////
app.get('/adminhome',(req,res)=>{
    if (req.session.user == null)
    res.render('login')

    var sql = "select * from adminlogin where email=?"
    let values = [req.session.user]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;

        else if (result.length > 0) {
            res.render('home', {data: result[0], admin: req.session.user })

        }
        
    })
})

////////////change admin password///////////////////////


app.post('/changeAdminpass', (req, res) => {

    let email = req.body.email;
    let curr_pass = req.body.cpass;
    let new_pass = req.body.cnpass;

    let sql = "UPDATE adminlogin SET password=? WHERE email=? and password=?"
    let values = [new_pass, email, curr_pass]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result1) => {
        console.log(result1.affectedRows);
        if (err) throw err;
        else if (result1.affectedRows != 0) {
            sql = "select * from adminlogin where email=?"
            let values = [email]
            sql = mysql.format(sql, values)
            con.query(sql, (err, result) => {
                if (err) throw err;
                else if (result.length > 0) {
                    req.session.user = email;
                    res.render('home', { msg: "password change  successfully....", data: result[0], admin: req.session.user })

                }
                else {
                    res.render('home', { msg: " change password failed  pls enter right email and password" })
                }
            })
        }
        else {

            sql = "select * from adminlogin where email=?"
            let values = [email]
            sql = mysql.format(sql, values)
            con.query(sql, (err, result) => {
                if (err) throw err;
                else if (result.length > 0) {
                    req.session.user = email;
                    res.render('home', { msg: " change password failed  pls enter right email and password", data: result[0], admin: req.session.user })

                }
            })
        }
    })

})


//admin section///////////////////////////////////////////////////////////////
//add customers.... and view  edit delete///////

app.get('/addCustomers', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    res.render('addCustomer', { admin: req.session.user })
})
// api for add customers
app.post('/addCustomers', (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let mobile = req.body.mob;
    let password = generateP();
    //console.log(password);
    //function for generate random password
    function generateP() {
        var password = '';
        var str = '0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';

        for (i = 1; i <= 8; i++) {

            var randomNumber = Math.floor(Math.random()
                * str.length + 1);

            password += str.charAt(randomNumber)
        }

        return password;
    };


    let sql = "insert into customers(name,email,mobile,password)values(?,?,?,?)";
    let values = [name, email, mobile, password];
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err
        else {
            var mailOptions = {
                from: "nitinproject12@gmail.com",
                to: email,
                subject: "new customer added",
                text: "you are added to Server Managemment System your Login Id is - " + email + "  and your password is- " + password
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error)
                    throw error
                else
                    res.render('addCustomer', { msg: "customer added.. details send to email.", admin: req.session.user })

            })

        }
    })
})

//view all customers/////////
app.get('/viewCustomers', (req, res) => {

    if (req.session.user == null)
        res.render('login')

    let sql = "select*from customers";
    con.query(sql, (err, result) => {
        if (err)
            throw err;
        else
            res.render('viewcustomers', { admin: req.session.user, data: result })
    })
})

///////delete customers

//delete mail...........
app.get('/deleteCustomer', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    var id = req.query.eid;
    console.log(id);
    var sql = "delete from customers where email=?"
    value = [id]
    sql = mysql.format(sql, value)
    con.query(sql, (err, result) => {
        if (err) throw err;
        else if (result) {
            var sql = 'select * from customers';
            con.query(sql, (err, result) => {
                if (err) throw err;
                else
                    res.render('viewcustomers', { data: result, admin: req.session.user, msg: 'Data Deleted' })
            })
        }
    })

})

/////////////////////edit customers details/////////////////////

//view clicked customers from ajax  call  for show data on  popup/////////


app.get('/ajaxSingleCustomer', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    let sql = "select*from customers where email=?";
    var id = req.query.email;
    console.log(id + "kkkkkkkkkkkkkkkkkkkkkkkkkk");
    value = [id]
    sql = mysql.format(sql, value)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;
        else if (result.length != 0) {
            res.json({ data: result, msg: "data Found" });
        }
        else {
            res.json({ admin: req.session.user, msg: 'data not found' });
        }
    })
})

////////update data of customer.///////////////////////////////////


app.post('/updateCustomer', (req, res) => {

    let name = req.body.username;
    let email = req.body.email;
    let mob = req.body.mob;
    let password = req.body.pass;

    let sql = "UPDATE customers SET name = ?, email= ?, mobile=? ,password=? WHERE email=?"
    let values = [name, email, mob, password, email]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err) throw err;
        else if (result) {
            var sql = 'select * from customers';
            con.query(sql, (err, result) => {
                if (err) throw err;
                else
                    res.render('viewcustomers', { data: result, admin: req.session.user, msg: 'Data updated' })
            })
        }
    })

})




///addplans  /////////////////////////////////////////////////////////////////////////////////////
app.get('/addplan', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    res.render('addplan', { admin: req.session.user })
})

app.post('/add_plan', (req, res) => {

    let planname = req.body.plname;
    let planprice = req.body.plprice;

    let sql = "insert into plans(plan_name,price)values(?,?)"
    let values = [planname, planprice]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err
        else
            res.render('addplan', { msg: "plans added. . . ", admin: req.session.user })

    })
})

///////////view plans

app.get('/viewplan', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    let sql = "select * from plans"
    con.query(sql, (err, result) => {
        if (err)
            throw err;
        else
            res.render('viewplan', { data: result, admin: req.session.user })

    })
})

///////delete plans

//delete plans.......
app.get('/deletePlan', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    var id = req.query.eid;
    console.log(id);
    var sql = "delete from plans where Id=?"
    value = [id]
    sql = mysql.format(sql, value)
    con.query(sql, (err, result) => {
        if (err) throw err;
        else if (result) {
            var sql = 'select * from plans';
            con.query(sql, (err, result) => {
                if (err) throw err;
                else
                    res.render('viewplan', { data: result, admin: req.session.user, msg: 'Data Deleted' })
            })
        }
    })

})


/////////////////////edit plans details/////////////////////

//view clicked plan from ajax  call  for show data on  popup/////////


app.get('/ajaxFindPlanById', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    let sql = "select*from plans where id=?";
    var id = req.query.id;
    console.log(id);
    value = [id]
    sql = mysql.format(sql, value)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;
        else if (result.length != 0) {
            res.json({ data: result, msg: "data Found" });
        }
        else {
            res.json({ admin: req.session.user, msg: 'data not found' });
        }
    })
})

////////update data of plan.///////////////////////////////////


app.post('/updatePlan', (req, res) => {
    let id = req.body.id;
    let planname = req.body.plan_name;
    let price = req.body.price;

    let sql = "update plans set plan_name=?, price=? where Id=?;"
    let values = [planname, price, id]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err) throw err;
        else if (result) {
            var sql = 'select * from plans';
            con.query(sql, (err, result) => {
                if (err) throw err;
                else
                    res.render('viewplan', { data: result, admin: req.session.user, msg: 'Data updated' })
            })
        }
    })

})



///////////////////////////create account and view/////////////////////////////////////////
app.get('/createaccount', (req, res) => {

    if (req.session.user == null)
        res.render('login')

    let sql = "select name,email from customers";
    con.query(sql, (err, usernames) => {
        console.log(usernames);
        if (err)
            throw err;
        else if (usernames.length > 0) {
            let sql = "select * from plans"
            con.query(sql, (err, plans) => {
                if (err)
                    throw err;
                else
                    res.render('create_account', { usernames: usernames, plans: plans, admin: req.session.user })
            })
        }
    })

})

/////////post accounts details
app.post('/create_Account', (req, res) => {

    let email = req.body.email;
    let username = req.body.username;
    let domainname = req.body.domainname;
    let planname = req.body.planname;
    let domaintaken = req.body.domaintaken;
    let domaincharges = req.body.domaincharges;
    let resisterdate = req.body.resisterdate;
    let timeperiod = req.body.timeperiod;
    let expirydate = req.body.expirydate;
    let hostingcharges = req.body.hostingcharges;
    let totalcharges = req.body.totalcharges;



    let sql = "insert into accounts(email,username,domainname,planname,domaintaken,domaincharges,resisterdate,timeperiod,expirydate,hostingcharges,totalcharges)values(?,?,?,?,?,?,?,?,?,?,?)"
    let values = [email, username, domainname, planname, domaintaken, domaincharges, resisterdate, timeperiod, expirydate, hostingcharges, totalcharges]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err
        else
            res.render('create_Account', { msg: "account create succesfully. . . ", admin: req.session.user })

    })
})





app.get('/viewAllaccounts', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    let sql = "select * from accounts"
    con.query(sql, (err, result) => {
        if (err)
            throw err;
        else
            res.render('viewALLaccounts', { data: result, admin: req.session.user })

    })
})


/////////////sql queries

// select *from accounts where expirydate between curdate() and expirydate;

//SELECT *FROM accounts WHERE MONTH(expirydate) = MONTH(CURRENT_DATE()) AND YEAR(expirydate) = YEAR(CURRENT_DATE());

app.get('/checkfilter', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    // const val=req.query.search;
    // console.log(val);

    let text = req.query.text + "%"
    console.log(text);
    let filter = req.query.filter
    console.log(filter);
    let sql = "select * from accounts";
    if (text) {
        sql = "select * from accounts where username like?";

    }

    if (filter) {
        if (filter == 'upcoming expiry') {
            sql = 'select * from accounts where expirydate between curdate() and expirydate';

        }
        else if (filter == 'current month expiry') {
            sql = 'SELECT *FROM accounts WHERE MONTH(expirydate) = MONTH(CURRENT_DATE()) AND YEAR(expirydate) = YEAR(CURRENT_DATE())';
        } else
            sql = "select * from accounts";
    }

    let values = [text]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(sql);
        if (err)
            throw err;
        else if (result.length != 0) {
            res.json({ data: result, msg: "data Found ..." });
        }
        else {
            console.log(" data not exist");
            res.json({ admin: req.session.user, msg: 'data not found !!!!!!!!' });
        }
    })

})




/////////////all transaction  

app.get('/ViewAlltransactions', (req, res) => {
    if (req.session.user == null)
    res.render('login')

    let sql = "select * from accounts";

    con.query(sql, (err, result) => {
        if (err)
            throw err;
        else if (result.length != 0) {
            console.log(result);


            var hostingcharges = result.map((val) => {
                return val.hostingcharges
            });

            var domaincharges = result.map((val) => {
                return val.domaincharges
            });
            var totalcharges = result.map((val) => {
                return val.totalcharges
            });
            var totalHC = hostingcharges.reduce((total, num) => {
                return total + num
            }, 0)
            var totalDC = domaincharges.reduce((total, num) => {
                return total + num
            }, 0)
            var gtotal = totalcharges.reduce((total, num) => {
                return total + num
            }, 0)
            var totaldata = { totalHC, totalDC, gtotal }



            res.render('Alltransactions', { data: result, totaldata: totaldata, admin: req.session.user })

        }

    })
})


app.get('/ajaxAlltransactions', (req, res) => {
    if (req.session.user == null)
    res.render('login')

    console.log(req.query);

    let date1 = req.query.startdate;
    let date2 = req.query.enddate;


    let sql = "select * from accounts where resisterdate between ? and ?"
    let values = [date1, date2]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;

        else if (result.length != 0) {
            console.log(result);


            var hostingcharges = result.map((val) => {
                return val.hostingcharges
            });

            var domaincharges = result.map((val) => {
                return val.domaincharges
            });
            var totalcharges = result.map((val) => {
                return val.totalcharges
            });
            var totalHC = hostingcharges.reduce((total, num) => {
                return total + num
            }, 0)
            var totalDC = domaincharges.reduce((total, num) => {
                return total + num
            }, 0)
            var gtotal = totalcharges.reduce((total, num) => {
                return total + num
            }, 0)
            var totaldata = [{ totalHC, totalDC, gtotal }]



            res.json({ data: result, totaldata: totaldata, inputdates: [req.query], admin: req.session.user })

        }


    })
})




//////customer section///////////////////////////////////////////////////////////////////////////////////////////////////////////

/// customer login
app.post('/C_logincheck', (req, res) => {
    let email = req.body.cemail;
    let password = req.body.cpassword
    var sql = "select * from customers where email=? and password=?"
    let values = [email, password]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;
        else if (result.length > 0) {
            req.session.user = email;
            res.render('home', { msg: "login successfully....", data: result[0], customer: req.session.user })

        }
        else {
            res.render('login', { msg: "login fail pls right email and password" })
        }

    })
})

//admin forget password///////////////


app.post('/forgetCustomersPass', (req, res) => {
    let email = req.body.email;
    var sql = "select password from customers where email=?"
    let values = [email]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        // console.log(result[0]);
        if (err)
            throw err;
        else if (result.length > 0) {
            var mailOptions = {
                from: "nitinproject12@gmail.com",
                to: email,
                subject: "forget password requeast ",
                text: " your password is-  " + result[0].password
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error)
                    throw error
                else
                    res.render('login', { msg: "password sent to your email ...please check your email." })

            })


        }
        else {
            res.render('login', { msg: " please enter right email..." })
        }

    })
})

///////////////////customerhome/////////////
app.get('/customerhome',(req,res)=>{
    if (req.session.user == null)
    res.render('login')

    var sql = "select * from customers where email=?"
    let values = [req.session.user]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(result);
        if (err)
            throw err;

        else if (result.length > 0) {
            res.render('home', {data: result[0], customer: req.session.user })

        }
        
    })
})

///////////change customers  password///////////////////////


app.post('/changeCustomerpass', (req, res) => {

    let email = req.body.email;
    let curr_pass = req.body.cpass;
    let new_pass = req.body.cnpass;

    let sql = "UPDATE customers SET password=? WHERE email=? and password=?"
    let values = [new_pass, email, curr_pass]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result1) => {
        console.log(result1.affectedRows);
        if (err) throw err;
        else if (result1.affectedRows != 0) {
            sql = "select * from customers where email=?"
            let values = [email]
            sql = mysql.format(sql, values)
            con.query(sql, (err, result) => {
                if (err) throw err;
                else if (result.length > 0) {
                    req.session.user = email;
                    res.render('home', { msg: "password change  successfully....", data: result[0], customer: req.session.user })

                }

            })
        }
        else {

            sql = "select * from customers where email=?"
            let values = [email]
            sql = mysql.format(sql, values)
            con.query(sql, (err, result) => {
                if (err) throw err;
                else if (result.length > 0) {
                    req.session.user = email;
                    res.render('home', { msg: " change password failed  pls enter right email and password", data: result[0], customer: req.session.user })

                }
            })
        }
    })

})


/////////////sql queries for view accounts of customer

app.get('/customerMyaccounts', (req, res) => {

    if (req.session.user == null)
        res.render('login')

    let sql = 'select * from accounts where email=?';
    let values = [req.session.user]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        if (err)
            throw err;
        else
            res.render('customer_MYaccounts', { data: result, customer: req.session.user })

    })
})

// select *from accounts where expirydate between curdate() and expirydate;

//SELECT *FROM accounts WHERE MONTH(expirydate) = MONTH(CURRENT_DATE()) AND YEAR(expirydate) = YEAR(CURRENT_DATE());

///jquery   for check exist ids in database/////////////
app.get('/checkCustomerAccounts', (req, res) => {
    if (req.session.user == null)
        res.render('login')

    // const val=req.query.search;
    // console.log(val);
    let sql = 'select * from accounts where email=?';
    let session = req.session.user;
    console.log(session);

    let filter = req.query.filter
    console.log(filter);

    if (filter.length != 0) {
        if (filter == 'upcoming expiry') {
            sql = 'select * from accounts where email=? AND expirydate between curdate() and expirydate';

        }
        else if (filter == 'current month expiry') {
            sql = 'SELECT *FROM accounts WHERE email=? AND MONTH(expirydate) = MONTH(CURRENT_DATE()) AND YEAR(expirydate) = YEAR(CURRENT_DATE())';
        }
    }


    let values = [req.session.user]
    sql = mysql.format(sql, values)
    con.query(sql, (err, result) => {
        console.log(sql);
        if (err)
            throw err;
        else if (result.length != 0) {
            res.json({ data: result, msg: "data Found" });
        }
        else {
            console.log(" not exist");
            res.json({ admin: req.session.user, msg: 'not found' });
        }
    })

})
