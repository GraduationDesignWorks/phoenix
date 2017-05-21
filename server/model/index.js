import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  account: String,
  name: String,
  password: String,
  avatar: String,
})

const tokenSchema = new Schema({
  account: String,
  token: String,
})

const followSchema = new Schema({
  follower: String,
  following: String,
})

const timelineSchema = new Schema({
  account: String,
  content: String,
  publishDate: Date,
  images: Array,
})

export default {
  user: mongoose.model('user', userSchema),
  token: mongoose.model('token', tokenSchema),
  follow: mongoose.model('follow', followSchema),
  timeline: mongoose.model('timeline', timelineSchema),
}