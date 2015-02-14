var GaugesChart = function(opts) {
  this.graphSize = 150;
  this.interval = 1000;

  if (opts) {
    this.graphSize = opts.size || this.graphSize;
    this.interval = opts.interval || this.interval;
  }

  this.data = [];
  this.gauges = {};
};

GaugesChart.prototype.init = function() {
  var self = this;

  this.gauges.requests = this.createGauge('requestsGauge', 'Req/s', 0, 50);
  this.gauges.bw = this.createGauge('bwGauge', 'MBps', 0, 1, true);
  this.gauges.errors = this.createGauge('errorsGauge', 'Error %', 0, 100);
  this.gauges.auth = this.createGauge('authGauge', 'Auth %', 0, 100);
  this.gauges.load = this.createGauge('loadGauge', 'Load', 0, 1, true);
  this.gauges.mem = this.createGauge('memGauge', 'Mem %', 0, 100);

  setInterval(function() {
    self.formatData();
    self.draw();
    self.data = [];
  }, this.interval);
};

GaugesChart.prototype.createGauge = function(container, label, min, max, decimalc) {
  var self = this;

  var config = {
    size: self.graphSize,
    label: label,
    min: undefined != min ? min : 0,
    max: undefined != max ? max : 100,
    minorTicks: 5,
    decimal: decimalc
  }

  var range = config.max - config.min;
  config.yellowZones = [{
    from: config.min + range * 0.75,
    to: config.min + range * 0.9
  }];
  config.redZones = [{
    from: config.min + range * 0.9,
    to: config.max
  }];

  var g = new Gauge(container, config);
  g.render();
  return g;
};

GaugesChart.prototype.draw = function() {
  this.gauges.bw.redraw();
  this.gauges.requests.redraw();
  this.gauges.errors.redraw();
  this.gauges.auth.redraw();
};

GaugesChart.prototype.appendData = function(req) {
  this.data.push(req);
};

GaugesChart.prototype.formatData = function() {
  var counter = 0;
  var totalBW = 0;
  var authed = 0;
  var errors = 0;

  for (var i = 0; i < this.data.length; i++) {
    var req = this.data[i];

    if (req.body_bytes_sent) {
      totalBW += req.body_bytes_sent;
    }

    if (!req.status || req.status >= 400) {
      errors++;
    }

    if (req.remote_user !== undefined && req.remote_user !== null) {
      authed++;
    }
  }

  totalBW = totalBW / 1024 / 1024;
  errors = parseInt((errors / this.data.length) * 100);
  authed = parseInt((authed / this.data.length) * 100);

  if (isNaN(errors)) {
    errors = 0;
  }
  if (isNaN(authed)) {
    authed = 0;
  }

  this.gauges.errors.data = errors;
  this.gauges.auth.data = authed;

  if (this.gauges.bw.config.max < totalBW) {
    this.gauges.bw = this.createGauge('bwGauge', 'MBps', 0, parseInt(totalBW) + 1, true);
  }
  this.gauges.bw.data = totalBW;

  if (this.gauges.requests.config.max < this.data.length) {
    this.gauges.requests = this.createGauge('requestsGauge', 'Req/s', 0, this.data.length);
  }
  this.gauges.requests.data = this.data.length;
};
