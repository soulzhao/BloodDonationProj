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
var donatorCtrl = require('../controllers/donatorctrl');

var expect = require('expect');

describe("test add_donation", function () {

    before(function(done) {
        done();
    }),
    it('async return an obj', function() {
        var new_donation = {
            donator_geo: [122, 80],
            donator_info:
            {
                first_name: "Soul",
                last_name: "Zhao",
                contact_number: "800113454545",
                email_addr: "soulzx2010@gmail.com",
                blood_group: "A",
                donator_address: "New York city start street"
            },
            donator_ip: "127.0.0.1",
            record_time: Date.now
        };

        var add_donation_fn = co.wrap(donatorCtrl.methods.add_donation);
        return add_donation_fn(new_donation).then(function (value) {
            console.log(typeof value);
            value.should.be.an.instanceOf(Object);
        });
    });
});

describe("test add donation with invalid email", function () {
    it('async return an obj', function() {
        var new_donation = {
            donator_geo: [122, 80],
            donator_info: {
                first_name: "TTT",
                last_name: "GGG",
                contact_number: "800113454545",
                email_addr: "soulzx2010gmail.com",
                blood_group: "A",
                donator_address: "New York city start street"
            },
            donator_ip: "127.0.0.1",
            record_time: Date.now
        };

        var add_donation_fn = co.wrap(donatorCtrl.methods.add_donation);
        return add_donation_fn(new_donation).then(function (value) {
            value.should.be.an.instanceOf(String);
        });
    });
});

describe("test add donation with Blood type", function () {
    it('async return an obj', function() {
        var new_donation = {
            donator_geo: [122, 80],
            donator_info: {
                first_name: "sss",
                last_name: "TTT",
                contact_number: "800113454545",
                email_addr: "soulzx2010@gmail.com",
                blood_group: "E",
                donator_address: "New York city start street"
            },
            donator_ip: "127.0.0.1",
            record_time: Date.now
        };

        var add_donation_fn = co.wrap(donatorCtrl.methods.add_donation);
        return add_donation_fn(new_donation).then(function (value) {
            value.should.be.an.instanceOf(String);
        });
    });
});

describe("test list_donations", function () {
    it('async return an list', function() {
        var ids = ['57d03ec5b3621a1ec4f83ae7', '57d068fb6c81c601601258b2'];
        var list_donations_fn = co.wrap(donatorCtrl.methods.list_donations);
        return list_donations_fn(ids).then(function (value) {
            value.should.be.an.instanceOf(Object);
        });
    });
});

//describe("test update_donation", function () {
//    it('async update a donation', function() {
//        var id = '57d0767e2ab6771424349033';
//        var update_data = {
//            first_name: "sss",
//            last_name: "TTT",
//            email_addr: "1099778@qq.com",
//            blood_group: "A"
//        };
//        var update_donation_fn = co.wrap(donatorCtrl.methods.update_donation);
//        return update_donation_fn(id, update_data).then(function (value) {
//            value.should.be.an.instanceOf(Object);
//        });
//    });
//});

describe("test non-exist del_donation", function () {
    it("delete a invalid donation", function () {
        var id = '57d0767e2ab6771428888033';
        var del_donation_fn = co.wrap(donatorCtrl.methods.del_donation);
        return del_donation_fn(id).then(function (value) {
            should(value).be.null;
        });
    });
});

//
// This case depends on the real data, not that reliable
//
//describe("test existing del_donation", function () {
//    it("delete a valid donation", function () {
//        var id = '57d0768e2ab6771424349034';
//        var del_donation_fn = co.wrap(donatorCtrl.methods.del_donation);
//        return del_donation_fn(id).then(function (value) {
//            value.should.be.an.instanceOf(Object);
//        });
//    });
//});
