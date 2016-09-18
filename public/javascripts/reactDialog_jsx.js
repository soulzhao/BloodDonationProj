/**
 * Created by Soul on 2016/9/7.
 */
define([
    "react",
    "esri/tasks/Locator",
    "dojo/request",
    "root-view"
], function(
    React,
    Locator,
    request,
    app
){
    var reDialog = React.createClass({
        getInitialState: function() {
            return {
                donator_address: "",
                first_name: "",
                last_name: "",
                contact_number: "",
                email_addr: "",
                blood_group: "A",
                coordinates: [],

                validate_pass: false,
                validate_message: null,
                creation_result: false,
                creation_resmsg: null
            };
        },

        componentDidMount: function() {
            this.state.coordinates = [
                this.props.mapPoint.longitude,
                this.props.mapPoint.latitude
            ];

            var dialog = this;
            this.props.locatorTask.locationToAddress(this.props.mapPoint).then(
                function (response) {
                    var realAddr = "Don't know this position";
                    if(response && response.hasOwnProperty("address")) {
                        realAddr = response.address;
                        if(typeof realAddr != "string" && realAddr.hasOwnProperty("Address"))
                        {
                            realAddr = realAddr.Address;
                        }else if(typeof realAddr != "string" && realAddr.hasOwnProperty("Match_addr")){
                            realAddr = realAddr.Match_addr;
                        }else{
                            realAddr = realAddr.toString();
                        }
                    }

                    dialog.setState({
                        donator_address: realAddr
                    });
                }
            ).otherwise(
                function (err) {
                    console.log("No address was found for this location");

                    dialog.setState({
                        donator_address: "Don't know this position"
                    });
                }
            );
        },

        setNewCoordinates: function (mapPoint) {
            this.setState({
                first_name: "",
                last_name: "",
                contact_number: "",
                email_addr: "",
                blood_group: "A",
                coordinates: [
                    mapPoint.longitude,
                    mapPoint.latitude
                ],

                validate_pass: false,
                validate_message: null,
                creation_result: false,
                creation_message: null
            });

            this.props.mapPoint = mapPoint;
            var dialog = this;
            this.props.locatorTask.locationToAddress(mapPoint).then(
                function (response) {
                    var realAddr = "Don't know this position";
                    if(response && response.hasOwnProperty("address")) {
                        realAddr = response.address;
                        if(typeof realAddr != "string" && realAddr.hasOwnProperty("Address"))
                        {
                            realAddr = realAddr.Address;
                        }else if(typeof realAddr != "string" && realAddr.hasOwnProperty("Match_addr")){
                            realAddr = realAddr.Match_addr;
                        }else{
                            realAddr = realAddr.toString();
                        }
                    }

                    dialog.setState({
                        donator_address: realAddr
                    });
                }
            ).otherwise(
                function (err) {
                    console.log("No address was found for this location");
                    dialog.setState({
                        donator_address: "Don't know this position"
                    });
                }
            );
        },

        onSubmit: function (event) {
            event.preventDefault();
            var dialog = this;

            if(!this.check_email(this.state.email_addr))
            {
                this.setState({
                    validate_pass: false,
                    validate_message: "email addr format error"
                });
                return;
            }
            if(!this.check_phone(this.state.contact_number))
            {
                this.setState({
                    validate_pass: false,
                    validate_message: "telphone format error"
                });
                return;
            }
            if(!this.check_required(this.state.first_name))
            {
                this.setState({
                    validate_pass: false,
                    validate_message: "first name is required"
                });
                return;
            }
            if(!this.check_required(this.state.last_name))
            {
                this.setState({
                    validate_pass: false,
                    validate_message: "last name is required"
                });
                return;
            }
            this.setState({
                validate_pass: true,
                validate_message: null
            });

            request.post(
                app.request_base_url + app.donatorView.request_route + "add_donation",
                {
                    data:
                    {
                        geolocation: this.state.coordinates.join(','),
                        first_name: this.state.first_name,
                        last_name: this.state.last_name,
                        contact_number: this.state.contact_number,
                        email_addr: this.state.email_addr,
                        blood_group: this.state.blood_group,
                        donator_address: this.state.donator_address
                    }
                }
            ).then(function(data){
                data = JSON.parse(data);
                if(data.success){
                    dialog.setState({
                        creation_result: true,
                        creation_message: "success"
                    });
                }else{
                    dialog.setState({
                        creation_result: false,
                        creation_message: data.data
                    });
                }
            }, function(err){}, function(evt){});
        },

        onClose: function (event) {
            this.props.view.ui.remove(this.props.rawui);
            app.donatorView.singleDialog = null;
        },

        handleChange: function(id, event){

            var input = event.target;

            // do validations here
            if(id == "first_name")
            {
                this.setState({
                    first_name: input.value
                });
            }else if(id == "last_name")
            {
                this.setState({
                    last_name: input.value
                });
            }else if(id == "blood_group")
            {
                this.setState({
                    blood_group: input.value
                });
            }else if(id == "contact_number")
            {
                this.setState({
                    contact_number: input.value
                });
            }else if(id == "email_addr")
            {
                this.setState({
                    email_addr: input.value
                });
            }
        },

        check_required: function(value){
            if(value === undefined ||
                value === "" ||
                value === null
            ){
                return false;
            }
            return true;
        },

        check_email: function (value) {
            var emailStr = value;
            var emailPat = /^(.+)@(.+)$/;
            var matchArray = emailStr.match(emailPat);
            if(matchArray !== null)
            {
                return true;
            }else{
                return false;
            }
        },

        check_phone: function (value) {
            var telStr = value;
            var telPart = /^[\+|00]\d{12}$/;
            var matchArray = telStr.match(telPart);
            if(matchArray !== null)
            {
                return true;
            }else{
                return false;
            }
        },

        render: function() {
            var dialog = this;
            return (<div className="popup_form_frame">
                        <h3>Please fill in below information</h3>
                        <form className="popup_form">
                            <div className="form-group">
                            <label htmlFor="first_name">First Name:</label>
                            <input className="person_info_blank form-control" type="text" name="first_name" value={dialog.state.first_name}
                                   onChange={dialog.handleChange.bind(this,'first_name')} />
                            <br />
                            <label htmlFor="last_name">Last Name:</label>
                            <input className="person_info_blank form-control" type="text" name="last_name" value={dialog.state.last_name}
                                   onChange={dialog.handleChange.bind(this,'last_name')} />
                            <br />
                            <label htmlFor="contact_number">TelPhone:</label>
                            <input className="person_info_blank form-control" type="text" name="contact_number" value={dialog.state.contact_number}
                                   onChange={dialog.handleChange.bind(this,'contact_number')} />
                            <br />
                            <label htmlFor="email_addr">Email:</label>
                            <input className="person_info_blank form-control" type="text" name="email_addr" value={dialog.state.email_addr}
                                   onChange={dialog.handleChange.bind(this,'email_addr')} />
                            <br />
                            <label htmlFor="blood_group">Blood Group:</label>
                            <select className="person_info_blank form-control" name="blood_group" value={dialog.state.blood_group}
                                    onChange={dialog.handleChange.bind(this,'blood_group')} >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                                <option value="O">O</option>
                            </select>
                            <br />
                             <input className="person_info_blank form-control" type="hidden" name="donator_address" value={dialog.state.donator_address}/>
                            </div>
                            {
                                dialog.state.creation_result ?
                                (
                                    <div className="alert alert-success">
                                        Your donation record is created successfully!
                                    </div>
                                ) :
                                (
                                    dialog.state.creation_message == null ? (null) :
                                    (
                                        <div className="alert alert-danger">
                                            {dialog.state.creation_resmsg}
                                        </div>
                                    )
                                )
                            }
                            {
                                dialog.state.validate_pass
                                    ?
                                (null) :
                                (
                                    dialog.state.validate_message == null ? (null):
                                   (<div className="alert alert-danger">
                                       {dialog.state.validate_message}
                                    </div>)
                                )
                            }
                            <div className="operation_panel">
                                <input value="Submit" type="button" onClick={dialog.onSubmit} className="btn btn-primary"/>
                                <input value="Cancel" type="button" onClick={dialog.onClose} className="btn btn-default"/>
                            </div>
                        </form>
                    </div>);
        }
    });

    return reDialog;
});