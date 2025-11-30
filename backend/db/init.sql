CREATE TABLE
    Port (
        PortID TEXT PRIMARY KEY,
        Name TEXT NOT NULL,
        LOCATION TEXT NOT NULL,
        Country TEXT NOT NULL,
        Longitude TEXT NOT NULL,
        Latitude TEXT NOT NULL
    );

CREATE TABLE
    Dock (
        DockID TEXT PRIMARY KEY,
        Name TEXT NOT NULL,
        PortID TEXT NOT NULL,
        FOREIGN KEY (PortID) REFERENCES Port (PortID)
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port001',
        'Sultan Qaboos Port',
        'Muscat, OM',
        'Oman',
        '58.5659182',
        '23.6286554'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port002',
        'Port of Duqm',
        'Duqm, OM',
        'Oman',
        '57.72682229999999',
        '19.664013'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port003',
        'Salalah Port',
        'Salalah, OM',
        'Oman',
        '53.9953894',
        '16.9414873'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port004',
        'Sohar Port',
        'Sohar, OM',
        'Oman',
        '56.6121145',
        '24.4848505'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port005',
        'Jebel Ali Port',
        'Dubai, UAE',
        'United Arab Emirates',
        '55.0515997',
        '25.0199321'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port006',
        'Khalifa Port',
        'Abu Dhabi, UAE',
        'United Arab Emirates',
        '54.71276470000001',
        '24.7756568'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port007',
        'Khorfakkan Port',
        'Sharjah, UAE',
        'United Arab Emirates',
        '56.367736',
        '25.3526481'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port008',
        'Khalid Port',
        'Sharjah, UAE',
        'United Arab Emirates',
        '55.3731033',
        '25.3580548'
    );

INSERT INTO
    Port (
        PortID,
        Name,
        LOCATION,
        Country,
        Longitude,
        Latitude
    )
VALUES
    (
        'Port009',
        'Port of Fujairah',
        'Fujairah, UAE',
        'United Arab Emirates',
        '56.36353219999999',
        '25.1727756'
    );