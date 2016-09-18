/**
 * Created by Soul on 2016/9/8.
 */

const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/bd");


const fs = require('fs');
const join = require('path').join;
const models = join(__dirname, '../models');

fs.readdirSync(models)
    .filter(file => ~file.search(/^[^\.].*\.js$/))
    .forEach(file => require(join(models, file)));

var should = require('should');
const co = require('co');
var patientCtrl = require('../controllers/patientctrl');

describe("test list donations", function () {
    it('async get obj list', function() {
        var coords = [121, 31];
        var dist = 10/112.1;

        var list_donations_fn = co.wrap(patientCtrl.methods.list_donations);
        return list_donations_fn(coords, dist).then(function (value) {
            value.should.be.an.instanceOf(Object);
        });
    });
});

//describe("test get valid donation details", function () {
//    it('async get valid donation info', function() {
//        var id = '57d0768e2ab6771424349034';
//        var list_donations_fn = co.wrap(patientCtrl.methods.detail_donation);
//        return list_donations_fn(id).then(function (value) {
//            value.should.be.an.instanceOf(Object);
//        });
//    });
//});

describe("test get invalid donation details", function () {
    it('async get invalid donation info', function() {
        var id = '57d03ec5b3621a1ec4f83ae7';
        var list_donations_fn = co.wrap(patientCtrl.methods.detail_donation);
        return list_donations_fn(id).then(function (value) {
            should(value).be.null;
        });
    });
});