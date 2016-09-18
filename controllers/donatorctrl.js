/**
 * Created by Soul on 2016/9/4.
 */

const mongoose = require('mongoose');
const Donation = mongoose.model('Donation');

exports.methods =  {
    list_donations: function* (ids) {
        return yield Donation.load_list(ids);
    },

    add_donation: function* (donation) {
        var newInstance = new Donation(donation);
        try {
            yield newInstance.validate();
            return yield newInstance.save();
        } catch(e) {
            err_msg = "";
            ['donator_ip', 'donator_info.email_addr', 'donator_info.blood_group'].forEach(
                function(path, idx, array){
                    err = e.errors[path];
                    if(e.errors[path] !== undefined)
                    {
                        err_msg += err.message;
                    }

                }
            );
            console.log(err_msg);
            return err_msg;
        }
    },

    del_donation: function* (id) {
        var ObjId = mongoose.Types.ObjectId;
        return yield Donation.findByIdAndRemove(new ObjId(id)).exec();
    },

    update_donation: function* (id, donation) {
        var ObjId = mongoose.Types.ObjectId;
        return yield Donation.findByIdAndUpdate(new ObjId(id), donation, {new: true}).exec();
    }
};