/**
 * Created by Soul on 2016/9/7.
 */
define([
    "dojo/query",
    "esri/Map",
    "esri/Basemap",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/core/watchUtils",
    "esri/widgets/Search",
    "esri/widgets/Locate/LocateViewModel",
    "esri/widgets/Locate"

], function(
    query,
    Map,
    Basemap,
    MapView,
    Graphic,
    GraphicsLayer,
    PictureMarkerSymbol,
    watchUtils,
    Search,
    LocateViewModel,
    Locate
){
    "use strict";
    var app = {
        scale: 4513.988705,
        basemap: "streets",
        viewPadding: {
            top: 50, bottom: 0
        },
        uiPadding: {
            top: 15, bottom: 15
        },
        zoom: 17,
        activeView: null,
        request_base_url: "http://localhost:3000/",

        components:{
            searchWidgetNav: null,

            // components functions
            newPinSymbol : function() {
                return new PictureMarkerSymbol({
                    url: "http://localhost:3000/images/pin.png",
                    width: "32px",
                    height: "39px"
                });
            },

            bindSearchWidget: function (parentId) {
                var search = new Search({
                    viewModel: {
                        view: app.activeView.rawMapView,
                        highlightEnabled: false,
                        popupEnabled: true,
                        showPopupOnSelect: true
                    }
                }, parentId);
                search.startup();
                return search;
            },

            createLocateWidget: function (rawMapView) {
                // Locating Setup
                var locatorVM = new LocateViewModel({
                    view: rawMapView,
                    goToLocationEnabled: true
                });
                // Add locateBtn widget
                var locateBtn = new Locate({
                    viewModel: locatorVM
                });
                locateBtn.startup();
                rawMapView.ui.add(locateBtn, {
                    position: "top-left",
                    index: 0
                });
                var stateWatcher = locatorVM.watch("state", function (newValue, oldValue, propertyName, target) {
                    if(newValue == "ready" && oldValue == "disabled") {
                        locateBtn.locate().then(function () {
                            console.log("locate to the user current location");
                            rawMapView.scale = app.scale;
                            rawMapView.zoom = app.zoom;
                            setTimeout(function(){
                                stateWatcher.remove();
                            }, 2000);
                        });
                    }
                });
            }
        },

        functions:{
            createRawMapView: function(containDiv){
                // layer to store the red points
                var routeLyr = new GraphicsLayer();

                var map = new Map({
                    basemap: app.basemap,
                    layers: [routeLyr]
                });

                var rawMapView = new MapView({
                    container: containDiv,
                    map: map,
                    scale: app.scale,
                    padding: app.viewPadding,
                    ui: {
                        components: ["zoom", "compass", "attribution"],
                        padding: app.uiPadding
                    },
                    zoom: app.zoom
                });
                rawMapView.graphicLayer = routeLyr;

                return rawMapView;
            },

            deleteMapPin: function (view, point){
                var rawMapView = view.rawMapView;
                rawMapView.graphicLayer.remove(point);

                var idx = view.pinPoints.indexOf(point);
                view.pinPoints.splice(idx, 1);
            },

            clearMapPins: function (view) {
                var rawMapView = view.rawMapView;
                view.pinPoints.forEach(function(p, idx, arr){
                    rawMapView.graphicLayer.remove(p);
                });
                view.pinPoints.length = 0;
            },

            addPins2DonatorView: function (view, mapPoint) {
                var pinSymbol = app.components.newPinSymbol();

                var graphicPoint = new Graphic({
                    geometry: mapPoint,
                    symbol: pinSymbol
                });
                view.pinPoints.push(graphicPoint);
                view.rawMapView.graphicLayer.add(graphicPoint);
            },

            addPins2PatientView: function (view, mapPoints, donations) {
                if(mapPoints.length)
                {
                    mapPoints.forEach(function (p, idx, arr) {
                        var donation = donations[idx];
                        var content =
                            "Name: {0}<br/>Blood group: {1}<br/>Email: {2}<br/>Telephone: {3}<br/>Address: {4}<br/>"
                                .format([
                                    donation.donator_info.first_name + " " + donation.donator_info.last_name,
                                    donation.donator_info.blood_group,
                                    donation.donator_info.email_addr,
                                    donation.donator_info.contact_number,
                                    donation.donator_info.donator_address
                                ]);

                        var pinSymbol = app.components.newPinSymbol();

                        var graphicPoint = new Graphic({
                            geometry: p,
                            symbol: pinSymbol,
                            popupTemplate:  {
                                title: "Donatior Detail",
                                content: content
                            }
                        });
                        view.pinPoints.push(graphicPoint);
                        view.rawMapView.graphicLayer.add(graphicPoint);
                    });
                }
            },

            onViewSizeChange: function (screenSize) {
                if (app.screenWidth !== screenSize[0]) {
                    app.screenWidth = screenSize[0];
                    app.functions.setPanelVisibility();
                }
            },

            setPanelVisibility: function () {
                var rawMapView = app.activeView.rawMapView;

                var isMobileScreen = rawMapView.widthBreakpoint === "xsmall" || rawMapView.widthBreakpoint === "small",
                    isDockedVisible = rawMapView.popup.visible && rawMapView.popup.currentDockPosition,
                    isDockedBottom = rawMapView.popup.currentDockPosition && rawMapView.popup.currentDockPosition.indexOf("bottom") > -1;
                // Mobile (xsmall/small)
                if (isMobileScreen) {
                    if (isDockedVisible && isDockedBottom) {
                        query(".calcite-panels").addClass("invisible");
                    } else {
                        query(".calcite-panels").removeClass("invisible");
                    }
                } else { // Desktop (medium+)
                    if (isDockedVisible) {
                        query(".calcite-panels").addClass("invisible");
                    } else {
                        query(".calcite-panels").removeClass("invisible");
                    }
                }
            },

            closeMenu: function () {
                if (query(".calcite-dropdown.open")[0]) {
                    query(".calcite-dropdown, .calcite-dropdown-toggle").removeClass("open");
                }
            },

            syncTabs: function (e) {
                query(".calcite-navbar li.active").removeClass("active");
                query(e.target).addClass("active");
            },

            syncViews: function(fromView, toView) {
                watchUtils.whenTrueOnce(toView, "ready").then(function(result) {
                    watchUtils.whenTrueOnce(toView, "stationary").then(function(result) {
                        toView.goTo(fromView.viewpoint);
                        toView.popup.reposition();
                    });
                });
            },

            syncSearch: function () {
                var searchWidgetNav = app.components.searchWidgetNav;
                searchWidgetNav.viewModel.view = app.activeView.rawMapView;
                // Sync
                if (searchWidgetNav.selectedResult) {
                    searchWidgetNav.search(searchWidgetNav.selectedResult.name);
                }
                app.activeView.rawMapView.popup.reposition();
            }
        },

        init : function () {
            this.components.searchWidgetNav =
                this.components.bindSearchWidget("searchNavDiv");

            // Panels - Dock popup when panels show (desktop or mobile)
            query(".calcite-panels .panel").on("show.bs.collapse", function(e) {
                var rawMapView = app.activeView.rawMapView;
                if (rawMapView.popup.currentDockPosition || rawMapView.widthBreakpoint === "xsmall") {
                    rawMapView.popup.dockEnabled = false;
                }
            });

            // Panels - Undock popup when panels hide (mobile only)
            query(".calcite-panels .panel").on("hide.bs.collapse", function(e) {
                var rawMapView = app.activeView.rawMapView;
                if (rawMapView.widthBreakpoint === "xsmall") {
                    rawMapView.popup.dockEnabled = true;
                }
            });

            // Tab Events (Views)
            query(".calcite-navbar li a[data-toggle='tab']").on("click", function(e) {
                app.functions.syncTabs(e);
                if (e.target.text.indexOf("Donator") > -1) {
                    app.functions.syncViews(app.patientView.rawMapView, app.donatorView.rawMapView);
                    app.activeView = app.donatorView;
                } else {
                    app.functions.syncViews(app.donatorView.rawMapView, app.patientView.rawMapView);
                    app.activeView = app.patientView;
                }
                app.functions.syncSearch();
            });

            // Basemap events
            query("#selectBasemapPanel").on("change", function(e){
                app.donatorView.rawMapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
                app.patientView.rawMapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
            });

            // Collapsible popup (optional)
            query(".esri-popup .esri-title").on("click", function(e){
                query(".esri-popup .esri-container").toggleClass("esri-popup-collapsed");
                app.activeView.rawMapView.popup.reposition();
            });
        }
    };

    return app;
});