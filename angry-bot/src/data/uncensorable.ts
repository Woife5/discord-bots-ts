export const uncensorable = [
    /^http.{0,8}$/,
    /^http(s)?:\/\/w.{0,8}$/,
    /^(http(s)?:\/\/)?www\..{0,8}$/,
    /^.{0,30}\.[a-z]{2,4}(\/.{0,15})$/, //should filter most domains abnd short links? also .png, jpeg ect
    /^.{0,3}discordapp.{0,3}$/,
    /^.{0,3}discord.{0,3}$/,
    /^.?thomas förg.?$/,
    /^: {0,2}\($/,
    /^.?angry.?$/,
    /^:angry32:$/,
    /^🤮$/,
    /^(.{0,2}\.)?png$/,
    /^attachments$/, //idk what this does, was in the list
    /^((.{0,3}<)?@)?[0-9]{0,18}>?$/ //discord ids or partial discord ids, also any number with less than 19 characters
];