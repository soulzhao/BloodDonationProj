/**
 * Created by Soul on 2016/9/4.
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//const ipValidator = require("is-ip");
const emailValidator = require("is-email");
/**
 *  Define Donation Schema
 **/

const DonationSchema = new Schema({

    donator_geo: {
        type:  [Number],
        required: [true, 'donator geo point required'],
        index: '2d'
    },
    donator_info:
    {
        first_name: {type: "String", default: '', trim: true },
        last_name: {type: "String", default: '', trim: true },
        contact_number: {
            type: "String",
            default: '',
            trim: true
        },
        email_addr: {
            type: "String",
            default: '',
            trim: true,
            validate: {
                validator: function(v) {
                    var res = emailValidator(v);
                    return res;
                },
                message: '{VALUE} is not a valid email address'
            }
        },
        blood_group: {
            type: "String",
            default: '',
            trim: true,
            required: [true, 'donator blood type cannot be blank'],
            validate: {
                validator: function(v) {
                    var res = ['A', 'AB', 'B', 'O'].indexOf(v);
                    return res >=0 ;
                },
                message: '{VALUE} is not a valid blood type'
            }
        },
        donator_address: {type: "String", default: '', trim: true }
    },
    donator_ip: {
        type: "String",
        required: [true, 'donator ip point required']
    },
    record_time: {type: Date, default: Date.now}
});


DonationSchema.methods = {
    // No member functions
};


DonationSchema.statics = {
    list: function(coords, distance){
        var maxDistance = distance / 111.12;
        return this.find({
            donator_geo: {
                $near: coords,
                $maxDistance: maxDistance
            }
        }).limit(500).exec();
    },

    load: function (id) {
        var ObjId = mongoose.Types.ObjectId;
        return this.findById({
            _id: new ObjId(id)
        }).exec();
    },

    load_list: function (id_list) {
        var ObjId = mongoose.Types.ObjectId;
        var obj_id_list = [];
        for(var i = 0; i < id_list.length; i++)
        {
            var id = id_list[i];
            obj_id_list.push(new ObjId(id));
        }
        return this.find({
            _id: {
                $in: obj_id_list
            }
        }).exec();
    }
};

mongoose.model('Donation', DonationSchema);