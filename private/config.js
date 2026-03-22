var config = {}

// lidarr api address "<address>/api/v1/"
config.lidarr_address = "http://127.0.0.1:8686/api/v1/";

// choose the port for the application <int>
config.port = 8888;

// ldap address to be used for auth
config.ldap_address = "ldap://localhost:3890";

// once set a preferred metadata profile in lidarr, paste here its name
config.metadata_profile_name = "Standard"
// same story for quality profile
config.quality_profile_name = "Any";

// time interval between requests towards lidarr to reload the queue <int>(ms)
config.queue_refresh_rate = 10000;

// if album/artist posters fail to load, set a max number of attempts to reload them <int>
config.max_retries = 10;
// to be used in sinergy with the previous setting <int>(ms)
config.sleep_between_retries = 1000;

config.bug_report_email = "ludovico@sardiniangale.org";

// displayed inside settings tab - add as many elements as you like
config.application_info = [
  "Version: 0.9",
  "License: GPL-3.0",
  "Last update: March 22, 2026",
  "Coming soon: album search",
  "<i>Never gonna give you up!</i>"
];

module.exports = config;
