'use strict';

exports = module.exports = function(app, mongoose) {
  var brandReportSchema = new mongoose.Schema({
    //data: [ mongoose.modelSchemas.Event, mongoose.modelSchemas.Editorial, mongoose.modelSchemas.Social, mongoose.modelSchemas.Newsletter ],
    data: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    }
  });
  app.db.model('BrandReport', brandReportSchema);
};
