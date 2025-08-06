import fs from 'fs'


const rawData = fs.readFileSync('src/data/winemag-data-130k-v2.json', 'utf8')
const rawWines = JSON.parse(rawData)

const cleaned = rawWines
.filter(w => w.description && w.points && w.country && w.variety)
.slice(0, 5000)
.map((wine, index) => ({
    id: `wine-${index}`,
    description: wine.description,
    points: wine.points,
    title: wine.title,
    country: wine.country,
    designation: wine.designation || 'Unknown',
    winery: wine.winery,
    variety: wine.variety,
    province: wine.province || 'Unknown',
    region_1: wine.region_1 || 'Unknown',
    region_2: wine.region_2 || 'Unknown',
    price: wine.price || 0,
    taster_name: wine.taster_name || 'Unknown'
}))

fs.writeFileSync('src/data/cleaned-wines.json', JSON.stringify(cleaned, null, 2))

console.log(`Cleaned ${cleaned.length} wine entries and saved to cleaned-wines.json`);
