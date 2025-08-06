import mongoose from 'mongoose' 
import { BASE_SCHEMA } from './baseSchema.js'   

const schema = new mongoose.Schema({
    description: { type: String, required: true },
    points: { type: Number},
    title: { type: String} ,
    country: { type: String },
    designation: { type: String },
    winery: { type: String },
    variety: { type: String },
    province: { type: String },
    region_1: { type: String },
    region_2: { type: String },
    price: {type: Number },
    taster_name: { type: String }
})


schema.add(BASE_SCHEMA)

export const WineModel = mongoose.model('Wine', schema)