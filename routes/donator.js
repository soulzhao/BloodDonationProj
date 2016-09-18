/**
 * Created by Soul on 2016/9/4.
 */
var express = require('express');
var router = express.Router();
const co = require('co');

var donatorCtrl = require('../controllers/donatorctrl');
const SECND_PER_DAY = 3600 * 24 * 1000;

function set_dnt_list_cooke(my_donation_list, res, new_dnt_id)
{
    res.cookie(
        'my_donation_list',
        my_donation_list + ";" + new_dnt_id,
        {
            expires: new Date(Date.now() + SECND_PER_DAY),
            httpOnly: true
        }
    );
}

function remove_dnt_list_cooke(dnt_list_str, res, del_dnt_id)
{
    if(dnt_list_str !== undefined &&
       dnt_list_str !== null &&
       dnt_list_str !== "")
    {
        var dnt_list = dnt_list_str.split(';');
        var idx = dnt_list.indexOf(del_dnt_id);
        if(idx >= 0)
        {
            dnt_list.splice(idx, 1);
            res.cookie(
                'my_donation_list',
                dnt_list.join(';'),
                {
                    expires: new Date(Date.now() + SECND_PER_DAY),
                    httpOnly: true
                }
            );
        }
    }
}

function handle_insert_form_data(req)
{
    var geolocation = req.body.geolocation;
    var locArray = geolocation.split(',');
    var numArray = [];
    for(var i = 0; i < locArray.length; i++)
    {
        var loc = locArray[i];
        numArray.push(loc);
    }
    var new_donation = {
        donator_geo: numArray,
        donator_info: {
            first_name : req.body.first_name,
            last_name : req.body.last_name,
            contact_number : req.body.contact_number,
            email_addr : req.body.email_addr,
            blood_group : req.body.blood_group,
            donator_address: req.body.donator_address,
        },
        donator_ip : req.ip
    };
    return new_donation;
}

function handle_update_form_data(req)
{
    var new_donation = {
        donator_info: {
            first_name : req.body.first_name,
            last_name : req.body.last_name,
            contact_number : req.body.contact_number,
            email_addr : req.body.email_addr,
            blood_group : req.body.blood_group
        }
    };
    return new_donation;
}

router.get('/list_donations', function(req, res, next) {
    var dnt_list_str = req.cookies.my_donation_list;
    if(dnt_list_str !== undefined)
    {
        var dnt_list = [];
        dnt_list_str.split(';').forEach(function (ele, idx, arr) {
            if(ele !== undefined &&
               ele !== null &&
              ele !== ""){
                dnt_list.push(ele);
            }
        });

        var list_donations = co.wrap(donatorCtrl.methods.list_donations);
        list_donations(dnt_list).then(function (donation_list) {
            res.json({
                success: true,
                data: donation_list
            });
        });
    }else{
        res.json({
            success: true,
            data: []
        });
    }
});

router.post('/add_donation', function(req, res, next) {

    var dnt_list_str = req.cookies.my_donation_list;
    if(dnt_list_str === undefined)
    {
        dnt_list_str = "";
    }

    var new_donation = handle_insert_form_data(req);
    var add_donation_fn = co.wrap(donatorCtrl.methods.add_donation);
    add_donation_fn(new_donation).then(function (value) {
        if(typeof value == "string")
        {
            //
            // Always means error
            //
            res.json({
                success: false,
                data: value
            });
        }else{
            //
            // Means created successfully, so use socket to emit messages
            //
            console.log("socket emit: add new donation: " + value._id);
            res.io.sockets.emit('new_donation_coming', value);

            var new_dnt_id = value._id.toString();

            set_dnt_list_cooke(dnt_list_str, res, new_dnt_id);
            res.json({
                success: true,
                donation_id: new_dnt_id
            });
        }
    });
});

router.delete('/del_donation/:id', function(req, res, next) {
    var dnt_list_str = req.cookies.my_donation_list;
    if(dnt_list_str === undefined)
    {
        dnt_list_str = "";
    }

    var donation_id = req.params.id;
    var del_donation = co.wrap(donatorCtrl.methods.del_donation);
    del_donation(donation_id).then(function (donation) {
        remove_dnt_list_cooke(dnt_list_str, res, donation_id);

        //
        // Means created successfully, so use socket to emit messages
        // io.emit == io.sockets.emit mark
        // all clients will recieve this message
        //
        console.log("socket emit: deleting donation id: " + donation_id);
        res.io.sockets.emit('donation_deleted', donation_id);

        res.json({
            success: true,
            data: {
                donation_id: donation_id
            }
        });
    });

});

router.post('/update_donation/:id', function(req, res, next) {
    var donation_id = req.params.id;
    var update_part = handle_update_form_data(req);

    var upd_donation =co.wrap(donatorCtrl.methods.update_donation);
    upd_donation(donation_id, update_part).then(function (donation) {
        //
        // Notify the client of the update
        //
        console.log("socket emit: update donation: " + donation._id);
        res.io.sockets.emit('donation_update', donation);

        res.json({
            success: true,
            data: {
                donation_id: donation._id.toString()
            }
        });
    });
});

module.exports = router;
