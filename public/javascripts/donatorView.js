/**
 * Created by Soul on 2016/9/7.
 */
define([
    "react",
    "react-dom",
    "dojo/dom",
    "dojo/on",
    "dojo/request",
    "dojo/dom-construct",
    "esri/tasks/Locator",
    "react-dialog",
    "root-view"
], function(
    React,
    ReactDOM,
    Dom,
    On,
    request,
    DomConstruct,
    Locator,
    ReDialog,
    app
){
    "use strict";
    var donatorView = {
        rawMapView: null,
        singleDialog: null,
        pinPoints: [],
        request_route: "donator/",
        donation_list: null,

        init: function(){
            this.rawMapView =
                app.functions.createRawMapView("donatorViewDiv");
            app.components.createLocateWidget(app.donatorView.rawMapView);

            // Set up map click event
            // Set up a locator task using the world geocoding service
            var locatorTask = new Locator({
                url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"
            });

            // Add event response for view
            this.rawMapView.on("click", function (evt) {
                // Close menu first
                app.functions.closeMenu();
                // Add pin
                app.functions.clearMapPins(app.donatorView);
                app.functions.addPins2DonatorView(app.donatorView, evt.mapPoint);
                // Add dialog
                if(app.donatorView.singleDialog === null)
                {
                    var node = document.createElement("div");
                    app.donatorView.rawMapView.ui.add(node, "top-left");

                    app.donatorView.singleDialog = ReactDOM.render(
                        React.createElement(
                            ReDialog, {
                                mapPoint: evt.mapPoint,
                                locatorTask: locatorTask,
                                view: app.donatorView.rawMapView,
                                rawui: node
                            }),
                        node
                    );

                    console.log("Create dialog for coordinates lon:" +
                        evt.mapPoint.longitude +
                        ", lat:" + evt.mapPoint.latitude
                    );
                }else{
                    app.donatorView.singleDialog.setNewCoordinates(evt.mapPoint);
                }
            });

            // Views - Listen to view size changes to show/hide panels
            this.rawMapView.watch("size", app.functions.onViewSizeChange);
            // Panels - Show/hide the panel when popup is docked
            this.rawMapView.popup.watch(["visible", "currentDockPosition"], app.functions.setPanelVisibility);

            // Set up donation list operations
            On(Dom.byId("show_panel_info"), "click", function (evt) {
                var getUrl = app.request_base_url + app.donatorView.request_route + "list_donations";
                request.get(getUrl, {}).then(function(data){
                    data = JSON.parse(data);
                    if(data.success){
                        var dn_list = data.data;
                        app.donatorView.donation_list = dn_list;

                        var trow =
                            '<tr id="{0}">\
                              <th scope="row">{1}</th>\
                            <td>{2}</td>\
                            <td>{3}</td>\
                            <td class="operation-td">\
                            <i id="{4}" class="fa fa-wrench oper-setting" aria-hidden="true" onClick="app.donatorView.onSetting(this,\'{4}\')"></i>\
                            <i id="{5}" class="fa fa-minus-circle oper-delete" aria-hidden="true" onClick="app.donatorView.onDelete(this,\'{5}\')"></i>\
                            </td>\
                            </tr>';
                        var trowlist = [];
                        dn_list.forEach(function(ele, idx, arr){
                            var insertRow = trow.format([
                                ele._id + "_tr",
                                idx,
                                ele.donator_info.first_name + " " + ele.donator_info.last_name,
                                ele.donator_info.donator_address,
                                ele._id + "_setting",
                                ele._id + "_delete"
                            ]);
                            trowlist.push(insertRow);
                        });

                        Dom.byId("donation_list_tbody").innerHTML = trowlist.join('\n');
                    }else{
                        var a = 1;
                    }
                }, function(err){}, function(evt){});
            });
        },

        onSetting: function(evt, id){
            id = id.split("_")[0];
            Dom.byId("donation_list_div").style="display:none";
            Dom.byId("detail_update_div").style="display:block";
            for (var i = 0; i < this.donation_list.length; i++)
            {
                var donation = this.donation_list[i];
                if(donation._id == id)
                {
                    Dom.byId("updform_first_name").value = donation.donator_info.first_name;
                    Dom.byId("updform_last_name").value = donation.donator_info.last_name;

                    Dom.byId("updform_contact_number").value = donation.donator_info.contact_number;
                    Dom.byId("updform_email_addr").value = donation.donator_info.email_addr;
                    Dom.byId("updform_blood_group").value = donation.donator_info.blood_group;

                    Dom.byId("updform_hidden_id").value = id;
                    break;
                }
            }
        },

        onDelete: function(evt, id){
            id = id.split("_")[0];
            request.del(
                app.request_base_url + this.request_route + "del_donation/" + id
            ).then(function(data){
                data = JSON.parse(data);
                if(data.success){
                    DomConstruct.destroy(id+"_tr");
                }else{
                    var a = 1;
                }
            });
        },

        onUpdate: function (src) {
            var id = Dom.byId("updform_hidden_id").value;
            request.post(
                app.request_base_url + this.request_route + "update_donation/" + id,
                {
                    data:
                    {
                        first_name: Dom.byId("updform_first_name").value,
                        last_name: Dom.byId("updform_last_name").value,
                        contact_number: Dom.byId("updform_contact_number").value,
                        email_addr: Dom.byId("updform_email_addr").value,
                        blood_group: Dom.byId("updform_blood_group").value
                    }
                }
            ).then(function(data){
                data = JSON.parse(data);
                if(data.success){
                    Dom.byId("success_result_div").style = "{display:block}";
                }else{
                    Dom.byId("fail_result_div").style = "{display:block}";
                }
            }, function(err){}, function(evt){});
        },

        onBack: function(){
            Dom.byId("donation_list_div").style="display:block";
            Dom.byId("detail_update_div").style="display:none";
        }
    };

    return donatorView;
});