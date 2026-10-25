// Official operator/government sources reviewed 2026-10-25.
// Public libraries are selected as general youth-friendly reading/learning places;
// this does not assert a teen-only space, supervision, free services or an event.
const mcl = 'https://midcolumbialibraries.org/branches';
const ncw = city => `https://www.ncwlibraries.org/locations/${city}-public-library/`;
const trl = 'https://timberland.bibliocommons.com/v2/locations';
const fvrl = 'https://fvrlibraries.bibliocommons.com/v2/locations';
const rows = [
 ['Adams','Othello Library','Mid-Columbia Libraries','Othello','99344','125 E Hemlock St',mcl],
 ['Asotin','Downtown Library','Asotin County Library','Clarkston','99403','417 Sycamore Street','https://www.asotincountylibrary.org/contact'],
 ['Benton','Kennewick Library','Mid-Columbia Libraries','Kennewick','99338','1620 S Union Street',mcl],
 ['Chelan','Wenatchee Public Library','NCW Libraries','Wenatchee','98801','310 Douglas St',ncw('wenatchee')],
 ['Clallam','Port Angeles Main Library','North Olympic Library System','Port Angeles','98362','2210 South Peabody Street','https://www.nols.org/locations-hours/'],
 ['Columbia','Columbia County Rural Library','Columbia County Rural Library District','Dayton','99328','111 S 3rd St','https://ccrld.org/contact-us/'],
 ['Cowlitz','Longview Public Library','City of Longview','Longview','98632','1600 Louisiana Street','https://www.longviewlibrary.org/743/Library'],
 ['Douglas','East Wenatchee Public Library','NCW Libraries','East Wenatchee','98802','271 9th Street NE',ncw('east-wenatchee')],
 ['Ferry','Republic Public Library','NCW Libraries','Republic','99166','794 S Clark Avenue',ncw('republic')],
 ['Franklin','Pasco Library','Mid-Columbia Libraries','Pasco','99301','1320 W Hopkins St',mcl],
 ['Garfield','Denny Ashby Library','Denny Ashby Library','Pomeroy',null,'856 Arlington Street','https://www.washingtonruralheritage.org/digital/collection/pomeroy'],
 ['Grant','Moses Lake Public Library','NCW Libraries','Moses Lake','98837','418 E 5th Avenue',ncw('moses-lake')],
 ['Grays Harbor','Hoquiam Timberland Library','Timberland Regional Library','Hoquiam','98550','420 7th Street','https://trl.org/locations/hoquiam/'],
 ['Island','Coupeville Library','Sno-Isle Libraries','Coupeville','98239','788 NW Alexander St','https://www.sno-isle.org/locations/coupeville/'],
 ['Jefferson','Jefferson County Library','Jefferson County Library District','Port Hadlock','98339','620 Cedar Avenue','https://www.jclibrary.info/about-us/location-hours'],
 ['King','Central Library','The Seattle Public Library','Seattle','98104','1000 Fourth Ave','https://www.spl.org/hours-and-locations/central-library'],
 ['Kitsap','Bremerton - Sylvan Way','Kitsap Regional Library','Bremerton','98310','1301 Sylvan Way','https://krl.bibliocommons.com/v2/locations'],
 ['Kittitas','Ellensburg Public Library','City of Ellensburg','Ellensburg','98926','209 N Ruby St','https://ellensburglibrary.org/'],
 ['Klickitat','Goldendale Community Library','Fort Vancouver Regional Libraries','Goldendale','98620','131 W Burgen St',fvrl],
 ['Lewis','Centralia Timberland Library','Timberland Regional Library','Centralia','98531','110 S Silver Street','https://trl.org/locations/Centralia/'],
 ['Lincoln','Hesseltine Public Library','Town of Wilbur','Wilbur','99185','14 NW Division','https://www.wilburwa.gov/1196/Hesseltine-Public-Library'],
 ['Mason','Shelton Timberland Library','Timberland Regional Library','Shelton','98584','710 W Alder Street','https://trl.org/locations/shelton/'],
 ['Okanogan','Okanogan Public Library','NCW Libraries','Okanogan','98840','228 Pine Street',ncw('okanogan')],
 ['Pacific','Raymond Timberland Library','Timberland Regional Library','Raymond','98577','507 Duryea Street',trl],
 ['Pend Oreille','Newport Library','Pend Oreille County Library District','Newport','99156','116 S Washington Ave','https://www.newportgriz.com/programs/grizzly-discovery-center/pend-oreille-county-library-district-newport-library'],
 ['San Juan','San Juan Island Library','San Juan Island Library','Friday Harbor','98250','1010 Guard St','https://catalog.sjlib.org/polaris/library/hours.aspx?ctx=3.1033.0.0.6'],
 ['Skagit','Anacortes Public Library','City of Anacortes','Anacortes','98221','1220 10th Street','https://www.anacorteswa.gov/m/directory/department?did=15'],
 ['Skamania','Stevenson Community Library','Fort Vancouver Regional Libraries','Stevenson','98648','120 NW Vancouver Ave',fvrl],
 ['Stevens','Colville Public Library','Libraries of Stevens County','Colville','99114','195 S Oak St','https://thelosc.org/'],
 ['Thurston','Olympia Timberland Library','Timberland Regional Library','Olympia','98501','313 8th Avenue SE','https://trl.org/locations/olympia/'],
 ['Wahkiakum','Cathlamet Public Library','Town of Cathlamet','Cathlamet','98612','115 Columbia Street','https://www.townofcathlamet.com/parks-recreation/public-library'],
 ['Walla Walla','Walla Walla Public Library','City of Walla Walla','Walla Walla',null,'238 E Alder St','https://www.wallawallapubliclibrary.org/about-us/contact-us'],
 ['Whatcom','Lynden Library','Whatcom County Library System','Lynden','98264','216 4th Street','https://www.wcls.org/'],
 ['Whitman','Colfax Library','Whitman County Library','Colfax','99111','102 South Main','https://www.whitcolib.org/about/contact/'],
 ['Yakima','Yakima Central Library','Yakima Valley Libraries','Yakima','98901','102 North 3rd Street','https://www.yvl.org/branch/yakima-library/']
];
export const statewideLocations = rows.map(([county,name,organization,city,zip_code,street,source_url])=>({
 id:`loc_library_${county.toLowerCase().replaceAll(' ','_')}`, name, organization,
 category:'Library', county, city, zip_code,
 address:`${street}, ${city}, WA${zip_code ? ` ${zip_code}` : ''}`, source_url
}));
