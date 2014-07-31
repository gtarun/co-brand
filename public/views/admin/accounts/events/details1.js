/* global app:true */

(function() {
  'use strict';

  app = app || {};

  app.Event = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      return '/admin/events/'+ this.id +'/';
    }
  });

  app.Delete = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {}
    },
    url: function() {
      return '/admin/events/'+ app.mainView.model.id +'/';
    }
  });

  app.Details = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      pivot: '',
      title: '',
      attendance: '',
      participation: ''
    },
    url: function() {
      return '/admin/events/'+ app.mainView.model.id +'/';
    },
    parse: function(response) {
      if (response.event) {
        app.mainView.model.set(response.event);
        delete response.event;
      }

      return response;
    }
  });

  app.Accounts = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      success: false,
      errors: [],
      errfor: {},
      groups: [],
      newAccount: ''
    },
    url: function() {
      return '/admin/events/'+ app.mainView.model.id +'/accounts/';
    },
    parse: function(response) {
      if (response.event) {
        app.mainView.model.set(response.event);
        delete response.event;
      }

      return response;
    }
  });

  app.HeaderView = Backbone.View.extend({
    el: '#header',
    template: _.template( $('#tmpl-header').html() ),
    initialize: function() {
      this.model = app.mainView.model;
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    }
  });

  app.DetailsView = Backbone.View.extend({
    el: '#details',
    template: _.template( $('#tmpl-details').html() ),
    events: {
      'click .btn-update': 'update'
    },
    initialize: function() {
      this.model = new app.Details();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      this.model.set({
        _id: app.mainView.model.id,
        pivot: app.mainView.model.get('pivot'),
        title: app.mainView.model.get('title'),
        attendance: app.mainView.model.get('attendance'),
        participation: app.mainView.model.get('participation')
      });
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    update: function() {
      this.model.save({
        pivot: this.$el.find('[name="pivot"]').val(),
        title: this.$el.find('[name="title"]').val(),
        attendance: this.$el.find('[name="attendance"]').val(),
        participation: this.$el.find('[name="participation"]').val()
          
      });
    }
  });

  app.DeleteView = Backbone.View.extend({
    el: '#delete',
    template: _.template( $('#tmpl-delete').html() ),
    events: {
      'click .btn-delete': 'delete',
    },
    initialize: function() {
      this.model = new app.Delete({ _id: app.mainView.model.id });
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    render: function() {
      this.$el.html(this.template( this.model.attributes ));
    },
    delete: function() {
      if (confirm('Are you sure?')) {
        this.model.destroy({
          success: function(model, response) {
            if (response.success) {
              location.href = '/admin/events/';
            }
            else {
              app.deleteView.model.set(response);
            }
          }
        });
      }
    }
  });


  app.AccountsView = Backbone.View.extend({
    el: '#accounts',
    template: _.template( $('#tmpl-accounts').html() ),
    events: {
      'click .btn-add': 'add',
      'click .btn-delete': 'delete',
      'click .btn-save': 'saveAccounts'
    },
    initialize: function() {
      this.model = new app.Accounts();
      console.log();
      this.syncUp();
      this.listenTo(app.mainView.model, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);
      this.render();
    },
    syncUp: function() {
      console.log("Sync Up called");
      this.model.set({
        _id: app.mainView.model.id,
        accounts: app.mainView.model.get('accounts')
      });
    },
    render: function() {
            console.log("RENDER called");
                  console.log(this.model.get('accounts'));

      this.$el.html(this.template( this.model.attributes ));

      for (var key in this.model.attributes) {
        if (this.model.attributes.hasOwnProperty(key)) {
          this.$el.find('[name="'+ key +'"]').val(this.model.attributes[key]);
        }
      }
    },
    add: function() {
      var newAccount = this.$el.find('[name="newAccount"]').val();
      var newAccountName = this.$el.find('[name="newAccount"] option:selected').text();
      if (!newAccount) {
        alert('Please select an account.');
        return;
      }
      else {
        var alreadyAdded = false;
        console.log(this.model.get('accounts'));
        _.each(this.model.get('accounts'), function(account) {
          if (newAccount === account) {
            alreadyAdded = true;
          }
        });

        if (alreadyAdded) {
          alert('That acccount already exists.');
          return;
        }
      }
      console.log(newAccount + " -- " + newAccountName);
       //this.model.get('accounts').push({ _id: newAccount, name: newAccountName });
      this.model.get('accounts').push(newAccount);
      console.log(JSON.stringify(this.model.get('accounts')));    
      console.log($('select').find('option:selected').remove());            
     var sorted = this.model.get('accounts');
        //console.log(JSON.stringify(sorted) + " sorted");
      //sorted.sort(function(a, b) {
        //return a.name.toLowerCase() > b.name.toLowerCase();
      //});
      //this.model.set('accounts', sorted);
        console.log(" this.model.get(accounts) : "+sorted);
      this.render();   
    },
    delete: function(event) {
      if (confirm('Are you sure?')) {
        var idx = this.$el.find('.btn-delete').index(event.currentTarget);
        this.model.get('accounts').splice(idx, 1);
        this.render();
      }
    },
    saveAccounts: function() {
      this.model.save();
    }
  });

  app.MainView = Backbone.View.extend({
    el: '.page .container',
    initialize: function() {
      app.mainView = this;
      this.model = new app.Event( JSON.parse( unescape($('#data-record').html()) ) );

      app.headerView = new app.HeaderView();
      app.detailsView = new app.DetailsView();
      app.deleteView = new app.DeleteView();
      app.accountView = new app.AccountsView();
    }
  });

  $(document).ready(function() {
    app.mainView = new app.MainView();
  });
}());
