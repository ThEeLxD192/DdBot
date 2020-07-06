//const to access to config.json
const config = require("./config.json");
//const's bot, Discord API
const Discord = require("discord.js");
const client = new Discord.Client();
//ytdl-core API-Stream about a link of youtube
const ytdl = require('ytdl-core');
//youtube-search API-Search at youtube
const search = require('youtube-search');
//ytpl API-Playlists
const ytplp = require('ytpl');
const prefix = config.prefix;
//options to play stream of an item with play
//you can check all options at https://discord.js.org/#/docs/main/12.2.0/typedef/StreamOptions
const streamOptions = { seek: 0, bitrate: 3000, passes: 20 };
//options to get an item with ytdl
//you can check all options at https://www.npmjs.com/package/ytdl-core
const options= { filter: "audioonly", quality: "highestaudio", highWaterMark: 500000 };
//options to search an item with search
//you can check all options at https://developers.google.com/youtube/v3/docs/search/list
const opts = {maxResults: 1, key: config.KeyY, type: 'video'};
//options to delete a message with delay
const delops = {timeout: 5000};
const delopsi = {timeout: 1000};
//Using a function map, create a queue for every server
const queue = new Map();
var n=0;
//Event when bot is ready to use it
client.on("ready", () => {
    console.log("Ready");
    client.user.setPresence( {
      status: "offline",
      game: {
          name: "With your MOM",
          type: "PLAYING"
      }
   });
});

//Bot await a messasge
client.on("message", async message => {
  //Part the message in substrings, in this case every space is a new substring
  const arg = message.content.split(" ");
  let voice =message.member.voice.channel;
  //queue gets a objet from a key
  const serverQueue = queue.get(message.guild.id);
  if(arg[0]==prefix)
  {
    message.delete(delops);
    switch(arg[1])
    {
      case "sound":
      {
        /*if(dispatcher==null){
          .....(arg[2],Voz);
        }else
          message.channel.send(`Reproduciendo musica actualmente`).then(b_msg => { b_msg.delete(delops); });
        *///break down
        break;
      }
      case "leave":
      {
        //bot leaves a channel
        if(!serverQueue)
          return message.channel.send('-.-').then(b_msg => { b_msg.delete(delops); });
        serverQueue.voiceChannel.leave();
        queue.delete(message.guild.id);
        break;
      }
      case "play":
      {
        if(!arg[2])
          return message.channel.send('-.-').then(b_msg => { b_msg.delete(delops); });
        arg.splice(0, 2);
        var Searh = arg.join(' ');
        if(ytplp.validateURL(Searh))
          Playlist(Searh,voice,message);
        else if(ytdl.validateURL(Searh))
          link(Searh,voice,message);
        else
          Buscar(voice,Searh,message);
        break;
      }
      case "skip":
      {
        if(!serverQueue)
          return message.channel.send('-.-').then(b_msg => { b_msg.delete(delops); });
        if(serverQueue.playing==false)
          return message.channel.send('¡No hay canción que saltar!').then(b_msg => { b_msg.delete(delops); });
        //ends a song in currently playing
        serverQueue.connection.dispatcher.end();
        break;
      }
      case "stop":
      {
        //clean a queue
        if(!serverQueue)
          return message.channel.send('-.-').then(b_msg => { b_msg.delete(delops); });
        serverQueue.songs=[];
        serverQueue.playing=false;
        serverQueue.connection.dispatcher.end();
        break;
      }
      case "queue":
      {
        n=0;
        showqueue(message);
        break;
      }
      case "help":
      {
        break;
      }
      default:
      {
        message.channel.send("Comando Incorrecto\nUse !Mar help para ver la lista de comandos").then(b_msg => { b_msg.delete(delops); });
        break;
      }
    }
  }
});

async function link(Link,Voz,message){
  const serverQueue = queue.get(message.guild.id);
  var songInfo,Minutos,Segundos,Song;
  try{
    songInfo = await ytdl.getInfo(Link);
  }catch(e){
    console.log(e);
    return;
  }
  Minutos = Math.trunc(songInfo.length_seconds/60);
  Segundos =songInfo.length_seconds%60;
  if(Segundos<10)
    Segundos="0"+Segundos;
  Song={
    title: songInfo.title,
    url: songInfo.video_url,
    minutos: Minutos,
    segundos: Segundos,
    author: message.author.username
  };

  if(!serverQueue){
    queueObject = {
      textChannel: message.channel,
      voiceChannel: Voz,
      connection: null,
      songs: [],
      volume: 1,
      playing: true,
     };
    queue.set(message.guild.id,queueObject);
    queueObject.songs.push(Song);
    try{
      var connection=await Voz.join();
      queueObject.connection=connection;
      play(message.guild,queueObject.songs[0]);
    }catch(e){
      console.log(e);
      queue.delete(message.guild.id);
      return;
    }
  }else{
    serverQueue.songs.push(Song);
    if(serverQueue.playing==false){
      serverQueue.playing=true;
      play(message.guild,serverQueue.songs[0]);
    }
  }
  const embedDatos= new Discord.MessageEmbed()
  .setTitle(`${songInfo.title}`)
  .setColor(0xae2f00)
  .setURL(Link);
  message.channel.send({embed: embedDatos}).then(b_msg => { b_msg.delete(delops); });
}

async function showqueue(message){
  const serverQueue = queue.get(message.guild.id);
  if(!serverQueue)
    return message.channel.send('¡No hay canción para mostrar!').then(b_msg => { b_msg.delete(delops); });
  var temp="";
  var end=0;
  var numsongs=Object.entries(serverQueue.songs).length;
  if(numsongs>5){
    for(var i=n;i<(n+5) && i<numsongs;i++){
      temp+=(i+1)+".-"+serverQueue.songs[i].title+" "+serverQueue.songs[i].minutos+":"+serverQueue.songs[i].segundos+" ("+serverQueue.songs[i].author+")\n";
    }
    const embedDatos= new Discord.MessageEmbed()
    .setTitle("QUEUE")
    .setDescription(temp)
    .setColor(0xae2f00);
    var msg=await message.channel.send({embed: embedDatos});
    msg.react('👍');
    msg.react('👎');
    msg.react('❌');
    const filter =(reaction,user)=>{
      return (reaction.emoji.name === '👍' || reaction.emoji.name ==='👎' || reaction.emoji.name === '❌') && user.id!==msg.author.id;
    };
    var collector=msg.createReactionCollector(filter,{max: 1});
    collector.on('collect',(reaction)=>{
      switch(reaction.emoji.name){
        case '👍':
        {
          msg.delete(delopsi);
          if((n+5)<numsongs && n<numsongs)
            n+=5;
          break;
        }
        case '👎':
        {
          msg.delete(delopsi);
          if(n!=0)
            n-=5;
          break;
        }
        case '❌':
        {
          msg.delete(delopsi);
          end=1;
          break;
        }
        default:
        {
          msg.delete(delopsi);
          break;
        }
      }
    });
    collector.on('end', collected => {
      if(end!==1)
        showqueue(message);
  });
  }else{
    for(var i=0;i<numsongs;i++){
      temp+=(i+1)+".-"+serverQueue.songs[i].title+" "+serverQueue.songs[i].minutos+":"+serverQueue.songs[i].segundos+" ("+serverQueue.songs[i].author+")\n";
    }
    const embedDatos= new Discord.MessageEmbed()
    .setTitle("QUEUE")
    .setDescription(temp)
    .setColor(0xae2f00);
    message.channel.send({embed: embedDatos}).then(b_msg => { b_msg.delete(delops); });
  }
}


async function Playlist(URL,Voz,message){
  var serverQueue = queue.get(message.guild.id);
  var ID=await ytplp.getPlaylistID(URL);
  var Songs=await ytplp(ID);
  var Song,Duration,queueObject;
  //var Tam=Songs.total_items;
  var Tam=Songs.items.length;

  const embedDatos= new Discord.MessageEmbed()
  .setTitle(Songs.title)
  .setColor(0xae2f00)
  .setURL(URL);
  message.channel.send({embed: embedDatos}).then(b_msg => { b_msg.delete(delops); });

  if(!serverQueue){
    queueObject = {
      textChannel: message.channel,
      voiceChannel: Voz,
      connection: null,
      songs: [],
      volume: 1,
      playing: true,
    };
    queue.set(message.guild.id,queueObject);
    serverQueue = queue.get(message.guild.id);
  }
  for(var i=0;i<Tam;i++){
    if(Songs.items[i].duration!=null){
      Duration=Songs.items[i].duration;
      Duration=Duration.split(":");
      Song={
        title: Songs.items[i].title,
        url: Songs.items[i].url_simple,
        minutos: Duration[0],
        segundos: Duration[1],
        author: message.author.username
      };
      serverQueue.songs.push(Song);
    }
  }
  if(serverQueue.connection==null){
    var connection=await Voz.join();
    serverQueue.connection=connection;
    play(message.guild,serverQueue.songs[0]);
  }
  if(serverQueue.playing==false){
    serverQueue.playing=true;
    play(message.guild,serverQueue.songs[0]);
  }
}
/*async function Sonidos(URL,Voz)
{
  //Si no lo esta que se una al canal de voz
  //Se usa el await para saber que tiene que esperar antes de realizar la siguiente parte del codigo
  //Se concecta y hasta que se conecte realiza lo siguiente
  if(connection==null)
    connection = await Voz.join();
  //Se crea la variable local dispatcher para manejar el stream
  //Play, Reproduce un archivo de tu computadora
  dispatcher = connection.play(`C:/Users/theel/Desktop/BotMusica/`+URL+`.mp3`,streamOptions);
  //Cuando termina de reproducir se ejecuta este evento
  dispatcher.on('finish', () => {
    dispatcher=null;
  });
}*/


async function play(guild,song) {
  const serverQueue = queue.get(guild.id);
  if(!song){
    serverQueue.playing=false;
    return;
  }
  try{
    const dispatcher = serverQueue.connection.play(ytdl(song.url,options),streamOptions);
    dispatcher.on('finish', () => {
      serverQueue.songs.shift();
      play(guild,serverQueue.songs[0]);
      dispatcher.setVolumeLogarithmic(serverQueue.volume);
    });
  }catch(e){
    console.log(e);
  }
}

async function Buscar(Voz,Busqueda,message){
  const serverQueue = queue.get(message.guild.id);
  var songArg, songURL, songInfo, Minutos, Segundos,Song, queueObject;
  try{
    songArg = await search(Busqueda, opts);
    if(songArg.results.length===0)
      return message.channel.send('Cancion no encontrada').then(b_msg => { b_msg.delete(delops); });
    songURL= songArg.results[0].link;
    songInfo = await ytdl.getInfo(songURL);
    Minutos = Math.trunc(songInfo.length_seconds/60);
    Segundos =songInfo.length_seconds%60;
    if(Segundos<10)
      Segundos="0"+Segundos;

    Song={
      title: songInfo.title,
      url: songInfo.video_url,
      minutos: Minutos,
      segundos: Segundos,
      author: message.author.username
    };
  }catch(e){
    console.log(e);
  }
  if(!serverQueue){
    queueObject = {
      textChannel: message.channel,
      voiceChannel: Voz,
      connection: null,
      songs: [],
      volume: 1,
      playing: true,
     };
    queue.set(message.guild.id,queueObject);
    queueObject.songs.push(Song);
    try{
      var connection=await Voz.join();
      queueObject.connection=connection;
      play(message.guild,queueObject.songs[0]);
    }catch(e){
      console.log(e);
      queue.delete(message.guild.id);
      return;
    }
  }else{
    serverQueue.songs.push(Song);
    if(serverQueue.playing==false){
      serverQueue.playing=true;
      play(message.guild,serverQueue.songs[0]);
    }
  }
  const embedDatos= new Discord.MessageEmbed()
  .setTitle(`${songInfo.title}`)
  .setColor(0xae2f00)
  .setURL(songURL);
  message.channel.send({embed: embedDatos}).then(b_msg => { b_msg.delete(delops); });
}
client.login(config.token);