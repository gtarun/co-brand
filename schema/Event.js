'use strict';

exports = module.exports = function(app, mongoose) {
    var eventSchema = new mongoose.Schema({
        _id: {
            type: String
        },
        pivot: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        },
        attendance: {
            type: Number,
            default: 0
        },
        participation: {
            type: Number,
            default: 0
        },
        accounts: [{
            type: String,
            ref: 'Account'
        }],
        userCreated: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            name: {
                type: String,
                default: ''
            },
            time: {
                type: Date,
                default: Date.now
            }
        }
    });
    eventSchema.methods.isVisibleTo = function(accounts) {
        for (var i = 0; i < this.accounts.length; i++) {
            if (this.accounts[i]._id === accounts) {
                return true;
            }
        }

        return false;
    };
    eventSchema.plugin(require('./plugins/pagedFind'));
    eventSchema.index({
        pivot: 1
    });
    eventSchema.index({
        title: 1
    });
    eventSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('Event', eventSchema);
};