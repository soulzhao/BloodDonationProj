/**
 * Created by Soul on 2016/9/4.
 */
var express = require('express');
var router = express.Router();
const co = require('co');

var patientCtrl = require('../controllers/patientctrl');

router.get('/list_donations', function(req, res, next) {
    try {
        var longitude = parseFloat(req.query.lon);
        var latitude = parseFloat(req.query.lat);
        var distance = parseFloat(req.query.dist);
        if(isNaN(longitude) ||
            isNaN(latitude) ||
            isNaN(distance))
        {
            throw new error("Queries are not numbers");
        }

        var list_donations_fn = co.wrap(patientCtrl.methods.list_donations);
        list_donations_fn([longitude, latitude], distance)
            .then(function(value){
                res.json({
                    success: true,
                    data: value
                });
            }
        );
    }catch(e) {
        console.log(e.message);
        res.json({
            success: false,
            data: "data format error with parameters"
        });
    }
});

router.get('/detail_donation/:id', function(req, res, next) {
    var donation_id = req.params.id;
    var detail_donation_fn = co.wrap(patientCtrl.methods.detail_donation);
    detail_donation_fn(donation_id).then(function(value){
        res.json({
            success: true,
            data: value
        });
    });
});

module.exports = router;
