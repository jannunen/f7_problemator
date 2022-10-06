const messages = {
    en: {
        ascentstatusfilter : {
            all : 'All',
            projects : 'Projects',
            climbed: 'Climbed',
            unclimbed: 'Untouched',
        },
        judging : {
            contender_name : 'Contender name',
            name_placeholder : 'Start writing contender name',
            judging_competitions : 'Judging sheet',
        },
        comps : {
            are_you_sure_you_want_to_register : 'Are you sure you want to register?',
            competitions: 'Competitions',
            upcoming_competitions: 'Upcoming competitions',
            ongoing_competitions: 'Ongoing competitions',
            ongoing_between: 'Comp is held between',
            comp_time_ends_in: 'Comp time ends in',
            registration_ends: 'Registration ends',
            not_registered: 'Not registered (yet)',
            contender: 'Contenders',
            prices: 'Entry fee',
            special_price: 'Special entry fee',
            paid_contenders_in_total: 'Confirmed contenders in total',
            categories: 'Categories',
            competition_title: 'Competition details',
            registration_has_ended: 'Registration has ended',
            paidregistrations: 'confimed',
            unpaidregistrations: 'unconfirmed',
            fastest_hands_wins: 'If categories have max. participants, paid contenders will get the spot over unpaid registrations.',
            category_full_text: 'FULL',
            register_button: 'Register',
            registered_unpaid: 'Registered, unpaid',
            registered_paid: 'Registered, paid',
            pay_comp: 'Pay',
            tick_saved: 'Tick saved',
            problems: 'Problems',
            timespan: 'Time span',
            participants: 'Participants',
            you_are_registered: 'You are registered!',
            you_are_registered_not_paid: 'You have registered, but not paid.',
            no_entry_fee: 'No entry fee',
            comp_registration_ends: 'Registration ends',
            competition_type: 'Competition type',
            variable_points: 'Variable points',
            ticked: 'ticked',
            you_are_a_judge: 'You are a judge in this competition',
            comp_type: 'Competition type',
            the_comp_has_not_started_yet: 'The competition time has not started yet',
        },
        global: {
            'join': 'If you want Problemator to be better, The easiest way is to create a pull request. The source code can be found from Github.',
        },
        settings: {
            settings_title: 'Settings',
        },
        gymselector: {
            active_gym: 'Active gym',
        },
        wallselector: {
            all_walls: 'All walls/sectors',
            active_wall: 'Wall filter',
        },
        badge_gym: {
            climbed_routes: "Climbed {n}% of {n} routes",
            climbed_problems: "Climbed {n}% of {n} problems",
        },
        mylogs: {
            open_archive: 'Open tick archive',
            my_logs: 'My logs',
            sessions: 'Sessions',
            ascents: 'Ascents',
            routes: 'Routes',
            problems: 'Problems',
            last_n_days_boulder: 'Last {n} days boulders',
            sport: 'Sport',
            all: 'All types',
            boulder: 'Boulder',
        },
        problemlist: {
            wallfilter: 'Wall filtering',
            problemnamefilter: 'Problem name filtering',
            sort_problems_by: 'Sort problems',
            gradefilter: 'Grade filter',
            stylefilter: 'Style filter',
            sortby: 'Sort by',
            problemlist: 'Problem list',
            reset_filters: 'Reset filters',
            visible_out_of: 'visible out of',
            problems: 'problems',
            'snap1': 'Bugger!',
            'snap2': 'Oh, snap!',
            'snap3': 'We hit a rough patch!',
            'snap4': 'Ooops, nothing found!',
            'snap5': '404 for problems!',
            'snap6': 'No hits!',
            'snap7': 'Nothing to show!',
            'snap8': 'Look for something else?',
            no_hits_title: 'No problems found',
            no_hits_desc: 'The filters were probably too restrictive, try to ease them up a little or reset them totally'
        },
        sortby: {
            routesetter_asc: 'Routesetter asc.',
            routesetter_desc: 'Routesetter desc',
            most_ticks: 'Most ticks',
            least_ticks: 'Least ticks',
            best: 'Most liked',
            worst: 'Least liked',
            hardest: 'Hardest grade first',
            easiest: 'Easiest grade first',
            newest: 'Newest',
            oldest: 'Oldest',
            sector_asc: 'Sector asc.',
            sector_desc: 'Sector desc',
            visible: 'visible',
            problems: 'problem(s)',
        },
        gradefilter: {
            minimum_grade: 'Min. grade',
            maximum_grade: 'Max. grade',
        },
        stylefilter: {
            title_stylefilter: 'Filter by style',
            reset_filter: 'Clear filters',

        },
        searchprob: {
            scan_qr_code_title: 'Scan QR Code from the problem',
            scan_qr_code_explainer: 'You can identify the problem with its code (eg. B002) or reading the QR code which opens the problem info page.',
            scan_qr_code: 'Scan QR Code',
            instructions: 'Routes are identified by route tags. Click "Read QR Code" or try entering B as a search.',
            find_a_route: 'Find a route',
            search_for_problems: 'Search for problems',
            read_qr: 'Read QR',
            hits: '{n} hits',
            no_hits: 'No problem(s) found',
        },
        problem: {
            no_opinion: 'No opinion',
            select_date: 'Select date',
            today: 'Today',
            choose_tick_date: 'Choose tick date',
            yesterday: 'Yesterday',
            add_a_tick: 'Add a tick',
            add_new_tick: 'Add new tick',
            what_is_your_grade_opinion: 'Select your grade opinion',
            tries: 'Tries',
            grade_opinion: 'Grade opinion',
            still_a_project: 'Still a project',
            projecting_not_possible: 'Already ticked',
            projecting_not_possible_desc: 'Ticked, projecting is not possible anymore',
            projecting: 'Projecting',
            sessions: 'none | one session | {n} sessions',
            you_have_no_ticks: 'You do not have any ascents for this problem/route.',
            see_ticks: 'List my ticks',
            ticked: 'Ticked',
            send: 'Send',

            start: 'Start',
            end: 'End',
            myticks_intro: "Here's the list of your ticks for this problem/route.<br /><br />You can delete ticks by swiping them to the left",
            routesetter: 'Routesetter',
            wall: 'Wall/Sector',
            my_ticks: 'My ticks',
            'tick_list_info': "Swipe left to delete a tick. There's currently no support for editing ticks. If you want to change a tick, delete it and add again.",
            'problem': 'Problem',
            'route': 'Route',
            'btn_add_tick': 'Add tick',
            'dislike': 'Dislike',
            'ascents': '{n} ascents',
            'likes': '{n} likes',
            'dislikes': '{n} dislikes',
            'dolike': 'Like +',
            'grade_opinions': 'Grade opinions',
            'problem_info': 'Problem info',
            notes: 'Notes',
            problem_details: 'Problem details',
            attributes: 'Attributes',
            tick_delete_are_you_sure: 'Are you sure you want to delete this ascent?',
            confirm_like: "Are you sure you want to like this problem?",
            tick_in_tries: "no tries | 1 try | {n} tries",
            confirm_dislike: "Are you sure you want to dislike this problem? The routesetter will get a notification about this, but it will be anonymous.",


        },
        home: {
            floor_maps: 'Floor maps',
            start_by_clicking_a_wall_or: 'Start by clicking a wall or',
            maps: 'map(s)',
            gym_not_selected: 'Gym not selected',
            gym_selection_info: 'Please select a gym you want to activate. You can change this later, so no sweat.',
            floor_map_missing: 'The gym floor map is missing',
            show_all_problems: 'Show all problems',
            by: 'by',
            'tries': 'Tries',
            'ascents': 'Ascents',
            'add': 'Add',
            'today': 'Today',
        },
        'btn_all_routes': 'All routes',
        'btn_new_routes': 'New routes',
        'btn_expiring_routes': 'Expiring routes',
        'btn_circuits': 'Circuits',
        global: {
            close_action: 'Close',
            clear_search_action: 'Clear search',
            are_you_sure: 'Are you sure?',
        }
    },
    fi: {
        searchprob: {
            instructions: 'Reitit tunnistetaan tarroilla, laita hakukenttään esim. B',
            search_for_problems: 'Etsi reittejä...',
            hits: 'Ei osumia | {n} osuma | {n} osumaa',
            find_a_route: 'Etsi reittiä',
            no_hits: 'Ei osumia',
            read_qr: 'Skannaa',
        },
        'amount': 'määrä',
        'delete': 'Poista',
        global: {
            'join': 'Jos haluat, että Problemator ois parempi, niin työnnä kädet saveen. Lähdekoodi löytyy Githubista',
            'back': 'Takaisin',
            'close_action': 'Sulje',
            'arr': 'Kaikki oikeudet pidätetään, takavalotakuu',
        },
        'btn_projects': 'Projektit',
        'btn_all': 'Kaikki',
        'btn_new': 'Uudet',
        'btn_expiring': 'Poistuvat',
        'btn_boulders': 'Boulderit',
        'btn_routes': 'Köysiradat',
        'btn_circuits': 'Circuitit',
        'btn_ticked': 'Tikatut',
        'volumes': 'Laatikot',
        'pinches': 'Nipistykset',
        'jugs': 'Kahvat',
        'dyno': 'Hypähdys',
        'fingery': 'Sormekas',
        'compression': 'Rutistus',
        'bodytension': 'Jäkitys',
        'mini': 'Pikkuihmisille',
        'endurance': 'Kestävyys',
        'slopers': 'Viettävät',
        'technical': 'Tekninen',
        'powerful': 'Äsäkkä',
        'complex': 'Monimutkainen',
        'coordination': 'Koordinaatio',
        'mantle': 'Manteli',
        'sensitive': 'Herkkä',
        'hooks': 'Koukut',
        'crimpers': 'Puristus',
        'pockets': 'Taskut',
        gyms: {
            page_title: 'Hallit',
            search_title: 'Etsi halleja...',
            search_for_gyms: 'Etsi halli',
        },
        sidebar: {
            menu: 'Valikko',
            logout: 'Kirjaudu ulos',
            gyms: 'Hallit',
        },
        stylefilter: {
            'reset_filter': 'Nollaa',
            'title_stylefilter': 'Ominaisuussuodattimet',
        },
        problems: {
            'page_title': 'Reitit',
            'wall_filter_active': 'Seinäsuodatin käytössä',
        },
        sortby: {
            'sort_problems_by': 'Järjestä reitit',
            'sector_asc': 'Sektorit a-ö',
            'sector_desc': 'Sektorit ö-a',
            'newest': 'Uusin ensin',
            'oldest': 'Vanhin ensin',
            'routesetter_asc': 'Ratamestari a-ö',
            'routesetter_desc': 'Ratamestari ö-a',
            'hardest': 'Vaikein ensin',
            'easiest': 'Helepoin ensin',
            'most_ticks': 'Eniten nousuja',
            'least_ticks': 'Vähiten nousuja',
            'best': 'Paras ensin',
            'worst': 'Kälyisin ensin',
        },
        gradefilter: {
            'maximum_grade': 'Maksimigreidi',
            'minimum_grade': 'Minimigreidi',
        },
        ticklist: {
            'popup_title': 'Tikkilista',
        },
        problem: {
            'problem_info': 'Radan tiedot',
            'route_info': 'Reitin tiedot',
            'btn_add_tick': 'Lisää tikki/projekti',
            'tick_delete_are_you_sure': 'Oletko varma, että haluat poistaa tikkauksen?',
            'tick_list_info': "Pyyhkäise vasemmalle tikin päällä, jos haluat poistaa sen. Tällä hetkellä tukea tikin editointiin ei ikävä kyllä ole.",
            'see_ticks': 'Näytä tikit',
            'reset_filters': 'Nollaa suodattimet',
            'tries': 'ei yrkkiä | 1 yrkkä | {n} yrkkää',
            'in_sessions': 'ei sessioita | 1 sessio| {n} sessiota',
            'in': '',
            'projecting': 'project',
            'attributes': 'Attribuutit',
            'projecting_not_possible': 'Tikattu, ei voi enää projektoida',
            'yesterday': 'eilen',
            'popup_title_date': 'Lähetyspäivän valinta',
            'choose_tick_date': 'Valitse lähetyspäivä',
            'popup_title_tries': 'Yrkkien määrä',
            'popup_title_grade_opinion': 'Greidimielipide',
            'what_is_your_grade_opinion': 'Mikä on mielipiteesi greidistä?',
            'no_opinion': 'Ei mielipidettä',
            'or_enter_custom_amount': 'tai syötä yrkkien määrä käsin',
            'save_tries': 'Tallenna',
            'close_action': 'Sulje',
            'custom_amt_tries': '...syötä määrä',
            'how_many_tries': 'Kuinka monta yrkkää meni',
            'add_a_tick': 'Lisää merkintä',
            'send': 'Lähetä',
            'today': 'Tänään',
            'ticked': 'Tikattu',
            'grade_opinion': 'Greidimielipide',
            'still_a_project': 'Jatka projektointia',
            'dislike': 'Epätykkää',
            'dislikes': 'Ei epätykkäyksiä | 1 epätykkäys | {n} epätykkäystä',
            'details': 'Radan tiedot',
            'grade_opinions': 'Greidimielipiteet',
            'notes': 'Lisätiedot',
            'problem': 'Rata',
            'route': 'Köysirata',
            'ascents': 'ei nousuja | nousu | {count} nousua',
            'likes': 'ei tykkäyksiä | tykkäys | tykkäystä',
            'dolike': 'tykkää'
        },
        mylogs: {
            'my_log': 'Lokikirja',
            'page_title': 'Lokikirjani',
            'boulder': 'boulderi',
            'sport': 'sportti',
            'all': 'kaikki'
        },
        home: {
            'default_gym_not_selected': 'Oletushallia ei ole valittu',
            'climbed': 'Kiivetty',
            'of': '',
            'of_routes': 'radasta',
            'sessions': 'sessiota',
            'routes': 'rataa',
            'last_n_days_boulder': 'Viimeiset {n} päivää - boulder',
            'start_by_clicking_a_wall_or': 'Aloita klikkaamalla seinää tai',
            'show_all_problems': 'näytä kaikki reitit',
            'add': 'lisää',
            'tries': 'yrkkää',
            'ascents': 'tikkiä',
            'today': 'Tänään',
            'logs': 'Lokikirja',
            'reset_filters': 'Nollaa suodattimet',
            'snap1': 'Voi elläissään!',
            'snap2': 'Voi pannahinen!',
            'snap3': 'Tuhannen tulimmaista!',
            'snap4': 'Myrsky ja mylväys!',
            'snap5': 'Voi elläimen käsi!',
            'snap6': 'Voi raatosanne!',
            'snap7': 'Kykin vemmanen!',
            'snap8': 'Pitikö vielä tämäkin nähä!',
            'no_hits_title': 'Ei yhtään rataa näytettäväksi.',
            'no_hits_desc': 'Suodattimet ovat todennäköisesti liian kireällä, höllää niitä vähän',
            'ascents': 'nousu(a)',
            'click_to_filter_by_wall': 'Klikkaa sektoria suodattaaksesi sektorin mukaan',
            'filters': 'Suodattimet',
            'floor_maps': 'Hallikartat',
            'maps': 'kartta(a)',
            'by': 'by',
            'problems': 'reitistä näkyvissä',
            'visible out of': '/'
        },
        pts: {
            'you_ticked': 'Tikatut',
            'projects': 'Projektit',
            'total': 'Yhteensä',
        }
    }
}

export default messages