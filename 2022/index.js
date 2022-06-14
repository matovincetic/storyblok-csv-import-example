const dotenv = require('dotenv')
dotenv.config({ path: '../.env' })

const slugify = ( text ) => {
  return text
  .toString()
  .normalize( 'NFD' )                   // split an accented letter in the base letter and the acent
  .replace( /[\u0300-\u036f]/g, '' )   // remove all previously split accents
  .toLowerCase()
  .trim()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-'); 
};

const fs = require('fs') 
const csvReader = require('fast-csv')
const StoryblokClient = require('storyblok-js-client')

// Initialize the client with the oauth token
const Storyblok = new StoryblokClient({
  oauthToken: process.env.TOKEN // can be found in your My account section
})

const config = {
  spaceId: process.env.SPACEID, // can be found in the space settings.
  // navigate into your folder and copy the id from the URL at app.storyblok.com <- last one
  // This is the Folder 2022/beitraege
  parentFolder: 131002653
}

let storiesArray = []

let dataDepartments = require('./data-departments.json')
let dataDays = require('./data-days.json')
let dataPlaces = require('./data-places.json')
let dataFormats = require('./data-formats.json')

const getDaysByUuid = (passedDaysFromCsv) => {
  const daysFromCsvAsArray = passedDaysFromCsv.split(', ')
  
  const arrayToBeCompared = [
    {
      dayUuidInStory: '1126cf71-3123-407e-9900-5848362c5d9d',
      dayNameInCsv: '2022-06-28'
    },
    {
      dayUuidInStory: '561f4c03-64db-401e-89c3-714cb0b39706',
      dayNameInCsv: '2022-06-29'
    },
    {
      dayUuidInStory: '45e721e4-519a-41c1-8afe-51265cb6763f',
      dayNameInCsv: '2022-06-30'
    },
    {
      dayUuidInStory: 'bd8b68d3-89a6-4d5a-a518-b65f7538370c',
      dayNameInCsv: '2022-07-01'
    }
  ]

  const newArrayPerDayWithUuids = daysFromCsvAsArray.map(dayInCsv => {
    const findInArrayToCompar = arrayToBeCompared.find(elementInArray => {
      return elementInArray.dayNameInCsv === dayInCsv || false
    })
    
    if (findInArrayToCompar) {
      return findInArrayToCompar.dayUuidInStory
    }
    return false
  })
  
  if (newArrayPerDayWithUuids.some(value => value === false)) {
    return false
  }
  
  return newArrayPerDayWithUuids
}

const getPlace = (passedLine) => {
  let nameToFindInStoryblokPlaces
  if (passedLine['ORT (UNI)'] === `VIE`) {
    nameToFindInStoryblokPlaces = passedLine['ADRESSE PLZ']
  } else {
    nameToFindInStoryblokPlaces = passedLine['ORT (UNI)']
  }
  
  let foundPlace = dataPlaces.stories.find(placeInData => {
    if (placeInData.name === nameToFindInStoryblokPlaces || placeInData.content.title === nameToFindInStoryblokPlaces) {
      return placeInData.uuid
    }
  })
  
  if (foundPlace) {
    return foundPlace.uuid
  } else {
    return false
  }
}

const getFormat = (passedLine) => {  
  let foundFormat = dataFormats.stories.find(formatInData => {
    if (formatInData.name === passedLine || formatInData.content.title === passedLine) {
      return formatInData.uuid
    }
  })
  
  if (foundFormat) return [ foundFormat.uuid ]
  return false
}

const getDepartment = (passedLine) => {  
  let foundDepartment = dataDepartments.stories.find(departmentInData => {
    if (departmentInData.name === passedLine || departmentInData.content.title === passedLine) {
      return departmentInData.uuid
    }
  })
  
  if (foundDepartment) return [ foundDepartment.uuid ]
  return false
}

const checkForDuplicates = (passedStory) => {
  const check = storiesArray.filter((storiesInArray) => {
    return storiesInArray.name === passedStory['AUSSTELLUNGSTITEL / PROJEKTTITEL (max. 60 ZmL)']
  })
  
  if (check.length > 0) {
    return slugify(`${passedStory['AUSSTELLUNGSTITEL / PROJEKTTITEL (max. 60 ZmL)']} ${check.length}`)
  }
  return slugify(`${passedStory['AUSSTELLUNGSTITEL / PROJEKTTITEL (max. 60 ZmL)']}`) 
}

let dataFromCsv = fs.createReadStream('Masterliste.csv')

csvReader.parseStream(dataFromCsv, { headers: true, delimiter: ',' })
  .on('data', (line) => {
    
    let notes_hardfacts = []
    let notes_copytext = []
    
    if (line['NOTIZ HARDFACTS ÜBERSCHRIFT DE'] && line['NOTIZ HARDFACTS TEXT DE']) {
      notes_hardfacts.push({
        title: line['NOTIZ HARDFACTS ÜBERSCHRIFT DE'],
        text: line['NOTIZ HARDFACTS TEXT DE'],
        title__i18n__en: line['NOTIZ HARDFACTS ÜBERSCHRIFT EN '],
        text__i18n__en: line['NOTIZ HARDFACTS TEXT EN ']
      })
    }
    
    if (line['NOTIZ COPYTEXT ÜBERSCHRIFT DE'] && line['NOTIZ COPYTEXT TEXT DE ']) {
      notes_copytext.push({
        title: line['NOTIZ COPYTEXT ÜBERSCHRIFT DE'],
        text: line['NOTIZ COPYTEXT TEXT DE '],
        title__i18n__en: line['NOTIZ COPYTEXT ÜBERSCHRIFT EN'],
        text__i18n__en: line['NOTIZ COPYTEXT TEXT EN']
      })
    }
    
    if (line['AAA (Angewandte Abschluss Arbeiten):'])
      notes_copytext.push({
      title: 'AAA (Angewandte Abschluss Arbeiten)',
      text: line['AAA (Angewandte Abschluss Arbeiten):'],
      title__i18n__en: 'AAA (Angewandte Abschluss Arbeiten)',
      text__i18n__en: line['AAA (Angewandte Abschluss Arbeiten):']
    })
    
    // one line of csv in here
    let story = {
      name: `${line['AUSSTELLUNGSTITEL / PROJEKTTITEL (max. 60 ZmL)']}` || ``,
      slug: checkForDuplicates(line),
      parent_id: config.parentFolder,
      content: {
        component: 'page_program_entry_2022',

        title: `${line['AUSSTELLUNGSTITEL / PROJEKTTITEL (max. 60 ZmL)']}` || ``,
        subtitle: `${line['UNTERTITEL DE (max. 150 ZmL)']}` || ``,
        subtitle__i18n__en: `${line['UNTERTITEL EN (ÜBERNIMMT MAGDALENA)  (max. 150 ZmL)']}` || ``,
        
        time_start: line['ZEIT START'],
        time_end: line['ZEIT ENDE'] || ``,
        
        days: getDaysByUuid(line['DATUM ']),
        
        place: getPlace(line),
        
        formats: getFormat(line['FORMAT (Festivalprogramm) ']),
        
        departments: getDepartment(line['ABTEILUNG']),
        
        place_city_name: line['ADRESSE TITEL'],
        place_city_address: `${line['ADRESSE GASSE']}, ${line['ADRESSE PLZ']} Wien`,
        place_city_address__i18n__en: `${line['ADRESSE GASSE']}, ${line['ADRESSE PLZ']} Vienna`,
        place_city_maps_link: line['ADRESSE MAPS LINK'],

        place_university_floor: line['STOCKWERK'],
        place_university_room: line['RAUMBEZEICHNUNG  / Zusatz'],
        
        text: line['TEXT KURZ DE (300-600 ZmL) '],
        text__i18n__en: line['TEXT KURZ EN PROJEKTTEXT (300-600 ZmL) ÜBERNIMMT MAGDALENA'],
        
        youtube: line['YOUTUBE'],
        vimeo: line['VIMEO'],
        soundcloud: line['SOUNDCLOUD'],
        
        project_website: line['PROJEKTWEBSITE'],
        
        notes_hardfacts: notes_hardfacts,
        notes_copytext: notes_copytext,
      }
    }
    
    if (story.content.place === false) {
      console.log(`${story.name} place is false`)
      return
    }
    
    storiesArray.push(story)
}).on('end', () => {
  storiesArray.forEach(story => {
    Storyblok.post(`spaces/${config.spaceId}/stories/`, {
      story
    }).then(res => {
      console.log(`Success: ${res.data.story.name} was created.`)
    }).catch(err => {
      console.log(`ERROR: ${story.name} failed.`)
    })
  })
})

