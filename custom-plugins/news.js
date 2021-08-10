/**
 * News System for " + serverName + "
 * This Shows News via the /news view command and sends news ns PMs when users connect to the server if they have subscribed
 * Uses nef to add News to nef's json database
 * Credits: Lord Haji, HoeenHero
 * @license MIT license
 */

"use strict";

const notifiedUsers = {};

function generateNews() {
  let newsData,
    newsDisplay = [];
  let keys = Db.news.keys();
  for (let i = 0; i < keys.length; i++) {
    newsData = Db.news.get(keys[i]);
    newsDisplay.push(
      `<h4>${keys[i]}</h4>${newsData[1]}<br /><br />—${Server.nameColor(
        newsData[0],
        true
      )} <small>on ${newsData[2]}</small>`
    );
  }
  return newsDisplay;
}

function showSubButton(userid) {
  let hasSubscribed = Db.NewsSubscribers.get(userid, false);
  return `<hr><center><button class="button" name="send" value="/news ${
    hasSubscribed ? `unsubscribe` : `subscribe`
  }">${
    hasSubscribed ? `Unsubscribe from the news` : `Subscribe to the news`
  }</button></center>`;
}
Server.showNews = function(userid, user) {
  if (!user || !userid) return false;
  if (!Db.NewsSubscribers.has(userid) || userid in notifiedUsers) return false;
  let newsDisplay = generateNews();
  if (newsDisplay.length > 0) {
    if (newsDisplay.length > 2) newsDisplay.splice(0, newsDisplay.length - 2);
    newsDisplay = `${newsDisplay.join(`<hr>`)}${showSubButton(userid)}`;
    notifiedUsers[userid] = setTimeout(() => {
      delete notifiedUsers[userid];
    }, 60 * 60 * 1000);
    return user.send(
      `|pm| ${serverName} Server|${user.getIdentity()}|/raw ${newsDisplay}`
    );
  }
};

exports.commands = {
  news: "servernews",
  announcements: "servernews",
  servernews: {
    "": "view",
    display: "view",
    view: function(target, room, user) {
      if (!this.runBroadcast()) return;
      let output = `<center><strong>${serverName} News:</strong></center>${generateNews().join(
        `<hr>`
      )}${showSubButton(user.userid)}`;
      if (this.broadcasting)
        return this.sendReplyBox(
          `<div class="infobox-limited">${output}</div>`
        );
      return user.send(`|popup||wide||html|${output}`);
    },
    remove: "delete",
    delete: function(target, room, user) {
      if (!this.can("news")) return false;
      if (!target) return this.parse("/help servernews");
      if (!Db.news.has(target))
        return this.errorReply("News with this title doesn't exist.");
      Db.news.remove(target);
      this.modlog(`NEWS`, null, `deleted Server News titled: ${target}.`);
      this.privateModAction(
        `(${user.name} deleted Server Ners titled: ${target}.)`
      );
    },
    add: function(target, room, user) {
      if (!this.can("news")) return false;
      if (!target) return this.parse("/help servernews");
      let parts = target.split(",");
      if (parts.length < 2)
        return this.errorReply("Usage: /servernews add [title], [desc]");
      let descArray = [];
      if (parts.length - 2 > 0) {
        for (let j = 0; j < parts.length; j++) {
          if (j < 1) continue;
          descArray.push(parts[j]);
        }
        parts[1] = descArray.join();
      }
      let title = parts[0],
        desc = parts[1],
        postedBy = user.name;
      let d = new Date();
      const MonthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
      ];
      let postTime = `${
        MonthNames[d.getUTCMonth()]
      } ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
      Db.news.set(title, [postedBy, desc, postTime]);
      this.modlog(`NEWS`, null, `Added News: ${parts[0]}`);
      this.privateModAction(`(${user.name} added server News: ${parts[0]})`);
    },
    subscribe: function(target, room, user) {
      if (!user.named)
        return this.errorReply("You must choose a name before subscribing");
      if (Db.NewsSubscribers.has(user.userid))
        return this.errorReply(
          "You are alreading subscribing " + serverName + " News."
        );
      Db.NewsSubscribers.set(user.userid, true);
      this.sendReply("You have subscribed " + serverName + " News.");
      this.popupReply(
        "|wide||html|You will receive " +
          serverName +
          " News automatically once you connect to the " +
          serverName +
          " next time.<br><hr><center><button class='button' name='send' value ='/news'>View News</button></center>"
      );
    },
    unsubscribe: function(target, room, user) {
      if (!user.named)
        return this.errorReply("You must choose a name before unsubscribing");
      if (!Db.NewsSubscribers.has(user.userid))
        return this.errorReply(
          "You have not subscribed " + serverName + " News."
        );
      Db.NewsSubscribers.remove(user.userid);
      this.sendReply("You have unsubscribed " + serverName + " News.");
      this.popupReply(
        "|wide||html|You will no longer automatically receive " +
          serverName +
          " News.<br><hr><center><button class='button' name='send' value='/news'>View News</button></center>"
      );
    }
  },
  servernewshelp: [
    "/servernews view - Views current " + serverName + " news.",
    "/servernews delete [news title] - Deletes announcement with the [title]. Requires @, &, ~",
    "/servernews add [news title], [news desc] - Adds news [news]. Requires @, &, ~",
    "/servernews subscribe - Subscribes to " + serverName + "News.",
    "/servernews unsubscribe - Unsubscribes to " + serverName + " News."
  ]
};
