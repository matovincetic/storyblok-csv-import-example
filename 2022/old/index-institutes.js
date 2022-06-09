const dotenv = require('dotenv')
dotenv.config()

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
  parentFolder: process.env.FOLDERID_INSTITUTES // navigate into your folder and copy the id from the URL at app.storyblok.com <- last one 
}

let stream = require('./institute.json')

stream.stories.forEach(storyFromJson => {
  let story = {
    name: `${storyFromJson.name}`,
    slug: slugify(`${storyFromJson.name}`),
    parent_id: config.parentFolder,
    content: {
      name: `${storyFromJson.name}`,
      link: storyFromJson.link ? storyFromJson.link : '',
      component: 'filter_institute',
    }
  }

  // console.log(story)

  Storyblok.post(`spaces/${config.spaceId}/stories/`, {
    story
  }).then(res => {
    console.log(`Success: ${res.data.story.name} was created.`)
  }).catch(err => {
    console.log(`${res.data.story.name} Error: ${err}`)
  })
})
  // .on('end', () => {
  //   // Done reading the CSV - now we finally create the component with a definition for each field
  //   // we can also skip that and define the content type using the interface at app.storyblok.com
  //   let component = {
  //     name: "post",
  //     display_name: "Post",
  //     schema: {
  //       title: {
  //         type: "text",
  //         pos: 0
  //       },
  //       text: {
  //         type: "markdown",
  //         pos: 1
  //       },
  //       image: {
  //         type: "image",
  //         pos: 2
  //       },
  //       category: {
  //         type: "text",
  //         pos: 3
  //       }
  //     },
  //     is_root: true, // is content type
  //     is_nestable: false // is nestable (in another content type)
  //   }

  //   Storyblok.post(`spaces/${config.spaceId}/components/`, {
  //     component
  //   }).then(res => {
  //     console.log(`Success: ${res.data.component.name} was created.`)
  //   }).catch(err => {
  //     console.log(`Error: ${err}`)
  //   })
  // })

