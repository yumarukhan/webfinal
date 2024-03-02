const mongoose = require('mongoose');

const portfolioItemSchema = new mongoose.Schema({
    titleenglish: {
        type: String,
        required: [true, 'A portfolio item must have a title'],
        trim: true
    },
    titlerussian: {
        type: String,
        required: [true, 'A portfolio item must have a title'],
        trim: true
    },
    descriptionenglish: {
        type: String,
        required: [true, 'A portfolio item must have a description']
    },
    descriptionrussian: {
        type: String,
        required: [true, 'A portfolio item must have a description']
    },
    images: [String],
    lastModifyed: {
        type: Date,
        default: new Date()
    }


});

const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);

module.exports = PortfolioItem;
