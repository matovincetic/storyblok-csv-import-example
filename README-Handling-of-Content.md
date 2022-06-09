* Copy the data folder from the previous year
	* Most of the content should be the same
	* Manually change updated content
* We need names und uuid of the data, therefore we use the links api to get all the link
	* For now, we are doing it manually like this
	* Enter this url for all of the data types in url
	* NOTE: links are not paginated, we retreive all links
	* `
		https://api.storyblok.com/v2/cdn/stories/?per_page=99&page=1&starts_with=2022/data/data-days/&token={secret-token}&version=draft&cv={random-number}
	`
	* Do this for:
		* data-places
		* data-formats
		* data-days
		* data-departments
		* NOTE: institues is not needed since the departments are linked to the insitutes
	* Save all of the json files in the folder for the current year
* Change the config.parentFolder to the current years folder ID
* Download the Content-Masterlist as .csv
	* Add it to the folder
* run the automation
