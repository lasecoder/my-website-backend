const mongoose = require("mongoose");

const headerSchema = new mongoose.Schema({ title: String });
const introSchema = new mongoose.Schema({ text: String });
const servicesSchema = new mongoose.Schema({ text: String });
const blogSchema = new mongoose.Schema({ text: String });
const ctaSchema = new mongoose.Schema({ text: String });
const footerSchema = new mongoose.Schema({ text: String });

const Header = mongoose.model("Header", headerSchema);
const Intro = mongoose.model("Intro", introSchema);
const Services = mongoose.model("Services", servicesSchema);
const Blog = mongoose.model("Blog", blogSchema);
const CTA = mongoose.model("CTA", ctaSchema);
const Footer = mongoose.model("Footer", footerSchema);

module.exports = { Header, Intro, Services, Blog, CTA, Footer };
