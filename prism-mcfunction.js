Prism.languages.mcfunction = {
   comment: { pattern: /^#.*/m, greedy: true },
   string: { pattern: /"([^"\\]|\\.)*"/, greedy: true },
   number: { pattern: /\b-?\d+(\.\d+)?\b/, greedy: true },

   selector: { pattern: /@[paresn]/, alias: 'keyword' },
   'selector-property': {
      pattern: /\b(?:scores|nbt|type|tag|name|advancements|distance|dx|dy|dz|gamemode|level|limit|predicate|sort|team|x|y|z|x_rotation|y_rotation)\s*=/,
      alias: 'property'
   },

   keyword: {
      pattern: /\b(?:advancement|attribute|ban|ban-ip|banlist|bossbar|clear|clone|damage|data|datapack|debug|defaultgamemode|deop|dialog|difficulty|effect|enchant|execute|experience|fetchprofile|fill|fillbiome|forceload|function|gamemode|gamerule|give|help|item|jfr|kick|kill|list|locate|loot|me|msg|op|pardon|particle|perf|place|playsound|publish|random|recipe|reload|return|ride|rotate|save-all|save-off|save-on|say|schedule|scoreboard|seed|setblock|setidletimeout|setworldspawn|spawnpoint|spectate|spreadplayers|stop|stopsound|summon|tag|team|teammsg|teleport|tell|tellraw|test|tick|time|title|tm|tp|transfer|trigger|version|w|waypoint|weather|whitelist|worldborder|xp)\b/,
      greedy: true
   },

   namespace: { pattern: /#?minecraft:[a-z0-9_\/]+/, alias: 'builtin' },

   nbt: {
      pattern: /\{[^}]*\}/,
      greedy: true,
      inside: {
         string: /"[^"]*"/,
         number: /\b-?\d+(\.\d+)?[bslfd]?/i,
         property: /\b[a-zA-Z0-9_]+(?=\s*:)/,
         punctuation: /[{},:]/
      }
   },

   bracket: { pattern: /\[|\]/, alias: 'punctuation' },
   punctuation: /[{}(),.:]/
};