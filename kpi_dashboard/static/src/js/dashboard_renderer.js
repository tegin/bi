odoo.define('kpi_dashboard.DashboardRenderer', function (require) {
    "use strict";

    var BasicRenderer = require('web.BasicRenderer');
    var session = require('web.session');
    var core = require('web.core');
    var registry = require('kpi_dashboard.widget_registry');
    var BusService = require('bus.BusService');
    var qweb = core.qweb;
    var _t = core._t;

    var DashboardRenderer= BasicRenderer.extend({
        className: "o_dashboard_view",
        _getDashboardWidget: function(kpi) {
            var Widget = registry.getAny([
                kpi.widget, 'abstract',
            ]);
            var widget = new Widget(this, kpi);
            return widget;
        },
        _renderView: function () {
            this.$el.html($(qweb.render('dashboard_kpi.base')));
            this.$el.find('.gridster').css('width', this.state.specialData.width)
            this.$grid = this.$el.find('.gridster ul')
            var self = this;
            this.kpi_widget = {};
            _.each(this.state.specialData.kpi_ids, function(kpi) {
                self.kpi_widget[kpi.id] = self._getDashboardWidget(kpi);
                self.kpi_widget[kpi.id].appendTo(self.$grid);
            });
            this.$grid.gridster({
                widget_margins: [
                    this.state.specialData.margin_x,
                    this.state.specialData.margin_y,
                ],
                widget_base_dimensions: [
                    this.state.specialData.widget_dimension_x,
                    this.state.specialData.widget_dimension_y,
                ],
                cols: this.state.specialData.max_cols,
            });
            this.channel = 'kpi_dashboard_' + this.state.res_id;
            this.call(
                'bus_service', 'addChannel', this.channel);
            this.call('bus_service', 'startPolling');
            this.call(
                'bus_service', 'onNotification',
                 this, this._onNotification
            );
            return $.when();
        },
        _onNotification: function(notifications) {
            var self = this;
            _.each(notifications, function (notification) {
                var channel = notification[0];
                var message = notification[1];
                if (channel === self.channel && message) {
                    var widget = self.kpi_widget[message.id];
                    if (widget !== undefined){
                        widget._fillWidget(message);
                    }
                }
            })
        },
    });

    return DashboardRenderer;

});
