const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');
const mongooseStringQuery = require('mongoose-string-query');
const autopopulate = require('mongoose-autopopulate');
const Cache = require('./cache.js');
const ParseArticle = require('../parsers/article.js').ParseArticle;
const getUrl = require('../utils/urls.js');

const createHash = require('crypto').createHash;

const EnclosureSchema = require('./enclosure.js');

const ArticleSchema = new Schema(
	{
		rss: {
			type: Schema.Types.ObjectId,
			ref: 'RSS',
			required: true,
			autopopulate: {
				select: [
					'title',
					'url',
					'feedUrl',
					'favicon',
					'categories',
					'description',
					'public',
					'valid',
					'publicationDate',
					'lastScraped',
					'images',
					'featured',
				],
			},
			index: true,
		},
		url: {
			type: String,
			trim: true,
			required: true,
			index: { type: 'hashed' },
		},
		// fingerprint stores the best uniqueness field we have for the given article
		fingerprint: {
			type: String,
			trim: true,
			required: true,
		},
		guid: {
			type: String,
			trim: true,
		},
		link: {
			type: String,
			trim: true,
		},
		title: {
			type: String,
			trim: true,
			required: true,
		},
		description: {
			type: String,
			trim: true,
			maxLength: 240,
			default: '',
		},
		content: {
			type: String,
			trim: true,
			default: '',
		},
		commentUrl: {
			type: String,
			trim: true,
			default: '',
		},
		images: {
			featured: {
				type: String,
				trim: true,
				default: '',
			},
			banner: {
				type: String,
				trim: true,
				default: '',
			},
			favicon: {
				type: String,
				trim: true,
				default: '',
			},
			og: {
				type: String,
				trim: true,
				default: '',
			},
		},
		publicationDate: {
			type: Date,
			default: Date.now,
		},
		enclosures: [EnclosureSchema],
		likes: {
			type: Number,
			default: 0,
		},
		valid: {
			type: Boolean,
			default: true,
			valid: true,
		},
	},
	{
		collection: 'articles',

		toJSON: {
			transform: function(doc, ret) {
				// Frontend breaks if images is null, should be {} instead
				if (!ret.images) {
					ret.images = {};
				}
				ret.images.favicon = ret.images.favicon || '';
				ret.images.og = ret.images.og || '';
			},
		},
		toObject: {
			transform: function(doc, ret) {
				// Frontend breaks if images is null, should be {} instead
				if (!ret.images) {
					ret.images = {};
				}
				ret.images.favicon = ret.images.favicon || '';
				ret.images.og = ret.images.og || '';
			},
		},
	},
);

ArticleSchema.plugin(timestamps, {
	createdAt: { index: true },
	updatedAt: { index: true },
});
ArticleSchema.plugin(mongooseStringQuery);
ArticleSchema.plugin(autopopulate);

ArticleSchema.index({ rss: 1, fingerprint: 1 }, { unique: true });

ArticleSchema.methods.getUrl = function() {
	return getUrl('article_detail', this.rss._id, this._id);
};

ArticleSchema.methods.getParsedArticle = async function() {
	let cached = await Cache.findOne({ url: this.url });
	if (cached) {
		return cached;
	}

	let response;
	try {
		response = await ParseArticle(this.url);
	} catch (e) {
		throw new Error(`Mercury API call failed for ${this.url}`);
	}
	let parsed = response.data;
	let content = parsed.content;

	// XKCD doesn't like Mercury
	if (this.url.indexOf('https://xkcd') === 0) {
		content = this.content;
	}

	const excerpt = parsed.excerpt || parsed.title || this.description;
	const title = parsed.title || this.title;

	if (!title) {
		return null;
	}

	cached = await Cache.create({
		content: content,
		excerpt: excerpt,
		image: parsed.lead_image_url || '',
		publicationDate: parsed.date_published || this.publicationDate,
		title: title,
		url: this.url,
		commentUrl: this.commentUrl,
		enclosures: this.enclosures,
	});
	return cached;
};

module.exports = {
  schema: 'Article',
  model: mongoose.model('Article', ArticleSchema)
}
