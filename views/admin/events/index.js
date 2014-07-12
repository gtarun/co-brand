'use strict';

exports.find = function(req, res, next){
  req.query.pivot = req.query.pivot ? req.query.pivot : '';
  req.query.title = req.query.title ? req.query.title : '';
  req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
  req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
  req.query.sort = req.query.sort ? req.query.sort : '_id';

  var filters = {};
  if (req.query.pivot) {
    filters.pivot = new RegExp('^.*?'+ req.query.pivot +'.*$', 'i');
  }
  if (req.query.title) {
    filters.title = new RegExp('^.*?'+ req.query.title +'.*$', 'i');
  }

  req.app.db.models.Event.pagedFind({
    filters: filters,
    keys: 'pivot title',
    limit: req.query.limit,
    page: req.query.page,
    sort: req.query.sort
  }, function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      results.filters = req.query;
      res.send(results);
    }
    else {
      results.filters = req.query;
      res.render('admin/events/index', { data: { results: escape(JSON.stringify(results)) } });
    }
  });
};

exports.read = function(req, res, next){
  var outcome = {};

  var getAccounts = function(callback) {
    req.app.db.models.Account.find({}, 'user.name').sort('user.name').exec(function(err, accounts) {
      if (err) {
        return callback(err, null);
      }

      outcome.accounts = accounts;
        //console.log("*****Accounts: " + outcome.accounts);
      return callback(null, 'done');
    });
  };

  var getRecord = function(callback) {
    req.app.db.models.Event.findById(req.params.id).exec(function(err, record) {
      if (err) {
        return callback(err, null);
      }

      outcome.record = record;
      return callback(null, 'done');
    });
  };

  var asyncFinally = function(err, results) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(outcome.record);
    }
    else {
        
    console.log("here ---");
        console.log(outcome.accounts);
        console.log(outcome.record);
      res.render('admin/events/details', {
        data: {
          record: escape(JSON.stringify(outcome.record)),
          accounts: outcome.accounts
        }
      });
    }
  };

  require('async').parallel([getAccounts, getRecord], asyncFinally);
};
/*
exports.read = function(req, res, next){
  req.app.db.models.Event.findById(req.params.id).exec(function(err, event) {
    if (err) {
      return next(err);
    }

    if (req.xhr) {
      res.send(event);
    }
    else {
        
        console.log(JSON.stringify(event));
      res.render('admin/events/details', { data: { record: escape(JSON.stringify(event)) } });
    }
  });
};*/

exports.create = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not create events.');
      return workflow.emit('response');
    }

    if (!req.body.pivot) {
      workflow.outcome.errors.push('A pivot is required.');
      return workflow.emit('response');
    }

    if (!req.body.title) {
      workflow.outcome.errors.push('A title is required.');
      return workflow.emit('response');
    }

    workflow.emit('duplicateEventCheck');
  });

  workflow.on('duplicateEventCheck', function() {
    req.app.db.models.Event.findById(req.app.utility.slugify(req.body.pivot +' '+ req.body.title)).exec(function(err, event) {
      if (err) {
        return workflow.emit('exception', err);
      }

      if (event) {
        workflow.outcome.errors.push('That event+pivot is already taken.');
        return workflow.emit('response');
      }

      workflow.emit('createEvent');
    });
  });

  workflow.on('createEvent', function() {
    var fieldsToSet = {
      _id: req.app.utility.slugify(req.body.pivot +' '+ req.body.title),
      pivot: req.body.pivot,
      title: req.body.title
    };

    req.app.db.models.Event.create(fieldsToSet, function(err, event) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.record = event;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.update = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not update events.');
      return workflow.emit('response');
    }

    if (!req.body.pivot) {
      workflow.outcome.errfor.pivot = 'pivot';
      return workflow.emit('response');
    }

    if (!req.body.title) {
      workflow.outcome.errfor.title = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchEvent');
  });

  workflow.on('patchEvent', function() {
    var fieldsToSet = {
      pivot: req.body.pivot,
      title: req.body.title
    };

    req.app.db.models.Event.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, event) {
      if (err) {
        return workflow.emit('exception', err);
      }

      workflow.outcome.event = event;
      return workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.delete = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not delete events.');
      return workflow.emit('response');
    }

    workflow.emit('deleteEvent');
  });

  workflow.on('deleteEvent', function(err) {
    req.app.db.models.Event.findByIdAndRemove(req.params.id, function(err, event) {
      if (err) {
        return workflow.emit('exception', err);
      }
      workflow.emit('response');
    });
  });

  workflow.emit('validate');
};

exports.accounts = function(req, res, next){
  var workflow = req.app.utility.workflow(req, res);

  workflow.on('validate', function() {
    if (!req.user.roles.admin.isMemberOf('root')) {
      workflow.outcome.errors.push('You may not change the accounts of events.');
      return workflow.emit('response');
    }

    if (!req.body.accounts) {
      workflow.outcome.errfor.accounts = 'required';
      return workflow.emit('response');
    }

    workflow.emit('patchEvent');
  });

  workflow.on('patchEvent', function() {
    var fieldsToSet = {
      accounts: req.body.accounts
    };

    req.app.db.models.Event.findByIdAndUpdate(req.params.id, fieldsToSet, function(err, event) {
      if (err) {
        return workflow.emit('exception', err);
      }

      event.populate('accounts', 'user.name', function(err, event) {
        if (err) {
          return workflow.emit('exception', err);
        }

        workflow.outcome.event = event;
        workflow.emit('response');
      });
    });
  });

  workflow.emit('validate');
};
