/**
 * Created by Soul on 2016/9/4.
 */

const mongoose = require('mongoose');
const Donation = mongoose.model('Donation');

exports.methods = {
    list_donations: function*(coords, distance){
        return yield Donation.list(coords, distance);
    },

    detail_donation: function*(id){
        return yield Donation.load(id);
    }
};