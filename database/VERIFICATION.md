# Source review — October 25, 2026

Verification means the cited operator/government source supports the retained facility identity and postal address. It does not certify operating hours, accessibility, teen eligibility, admission, events, transit routing, or a field visit. County assignments follow the facility cities; no boundary/geocoding verification was performed. Coordinates from the supplied script were discarded.

| Original entry | Resolution | Official evidence |
| --- | --- | --- |
| Edmonds teen STEM/gaming lounge | Retain as **Edmonds Library**, 650 Main St, Edmonds 98020. Remove invented lounge title, weekly labs, esports, kits, email, ages and transit. | https://sno-isle.bibliocommons.com/v2/locations/ |
| Everett YMCA late night | Retain as **Everett Family YMCA**, **4730 Colby Ave, Everett 98203**. Original Rockefeller address is not the current branch address. Remove free dinner, late-night, pool access, email, ages and transit claims. | https://ymca-snoco.org/everett-ymca |
| Everett teen drop-in/leadership hub | Omit. Operator page could not be retrieved in this review; third-party references do not verify the claimed teen program. No conclusion that the club does not exist. | Attempted https://www.bgcsc.org/clubs/everett-club |
| TeenTix HQ/arts hub | Omit as a physical destination: reviewed contact/about pages did not establish the supplied street address or a drop-in arts hub. TeenTix is a real organization; a free membership must not be represented as blanket free admission. | https://www.teentix.org/contact/ and https://www.teentix.org/about/ |
| Central Library / The Hive teen space | Retain **Central Library**, 906 W Main Ave, Spokane 99201. The Hive is a separate facility. Remove maker-space, 3D printer and gaming-PC claims. | https://www.spokanelibrary.org/central/ and https://www.spokanelibrary.org/hive/ |
| Tacoma Hope Centers / late night | Retain **Henry T. Schatz Branch at the Donald G. Topping Regional HOPE Center**, 3875 S 66th St, Tacoma **98409**. Remove blanket free access, meals, late-night, ages, email and transit. | https://www.bgcsps.org/about-us/contact-us |
| Firstenburg Teen Zone | Retain **Firstenburg Community Center**, 700 NE 136th Ave, Vancouver. Official age/space guidelines support the facility identity/address, not the claimed free tutoring/drop-in program. ZIP omitted because selected evidence did not establish it. PDF is dated source material, not confirmation of today's programs. | https://www.cityofvancouver.us/wp-content/uploads/2023/09/FCC-Age-Guidelines.pdf |
| Swift Orange Pioneer / Northgate Vault | Both omitted entirely. No verified cache listing, placement permission, clue, inventory, rewards or coupons. | No verified source supplied or found in reviewed material. |

All 39 county names are sourced from Washington OFM: https://ofm.wa.gov/washington-data-research/county-data . The initial five retained facilities covered four counties. The subsequent statewide expansion adds 35 public libraries, bringing the inventory to 40 facilities in all 39 counties. No regional taxonomy was inferred. See STATEWIDE-SOURCES.md for the complete current facility/source register.

Every retained facility has a source URL, verification date and explicit verification scope in the database. All price/age/transit/contact/coordinate fields remain NULL rather than silently meaning free, teen-only or mapped. No events, ZIP inventory or caches are seeded. Facility postal ZIPs do not establish complete ZIP-to-county relationships.

## Statewide expansion review

Public libraries are selected as general youth-friendly reading/learning destinations. This is an editorial suitability inference, not a claim that every branch has a dedicated teen room or supervised program. The database verification scope remains facility identity and address. County assignments use the facility cities; no parcel-level geocoding or boundary analysis was performed.

Official operator/government HTML and official operator directories support the additions. Two records use explicitly noted alternate official evidence: Denny Ashby Library uses the library-coordinated Washington Rural Heritage collection (direct library website timed out; collection content/address was available through the web index), and Newport uses the Newport School District partnership page. Walla Walla's operator contact page/address was available through the web index but direct retrieval returned 403; its operator-published youth activity brochure independently gives the same street address. These are source limitations, not evidence of closure. No current hours are claimed. ZIPs not established in selected evidence remain NULL.

Excluded during research: Aberdeen Library (official branch page reports a remodel closure from October 2026), Davenport City Library (official city page reports closed), and Ephrata Library as an ordinary destination (official branch page reports temporary pop-up operation during remodeling). Hoquiam, Hesseltine in Wilbur, and Moses Lake were used for those counties instead. No event dates were imported.

Official evidence for exclusions and supplemental context:

- https://trl.org/locations/aberdeen/
- https://www.davenportwa.us/index.asp?SEC=EA1BEF96-CBC1-4BD4-AE0A-C1A130B69E21&Type=B_BASIC
- https://www.ncwlibraries.org/locations/ephrata-public-library/
- https://www.wallawallapubliclibrary.org/home/showpublisheddocument/11317/638877442212170000

The no-Docker local path was executed and persists data under .local/hopscout. The ZIP deliverable excludes this runtime database, dependencies and .env credentials; running local:setup recreates the reviewed seed.
