// =========== DATABASE ===========
const Dexie = require("dexie");

Dexie.debug = false;

let pandodb = new Dexie("PandoraeDatabase");

let structureV1 = "id,date,name";

pandodb
  .version(1)
  .stores({
    enriched: structureV1,
    scopus: structureV1,
    csljson: structureV1,
    zotero: structureV1,
    twitter: structureV1,
    anthropotype: structureV1,
    chronotype: structureV1,
    geotype: structureV1,
    pharmacotype: structureV1,
    publicdebate: structureV1,
    gazouillotype: structureV1,
    hyphe: structureV1,
    system: structureV1
  });
pandodb
  .version(2)
  .stores({
    hyphotype: structureV1,
    enriched: structureV1,
    scopus: structureV1,
    csljson: structureV1,
    zotero: structureV1,
    twitter: structureV1,
    anthropotype: structureV1,
    chronotype: structureV1,
    geotype: structureV1,
    pharmacotype: structureV1,
    publicdebate: structureV1,
    gazouillotype: structureV1,
    hyphe: structureV1,
    system: structureV1
  });

  pandodb.open();