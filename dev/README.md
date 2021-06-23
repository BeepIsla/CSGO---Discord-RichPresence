## Dev

This is used to easily update the list of images. This is only useful to you if you have your own custom Discord application.

Create a config following the example, `id` is your application ID, `token` is your Discord authentication token (**NEVER SHARE THIS TOKEN WITH ANYONE - IT GRANTS FULL ACCESS TO YOUR DISCORD ACCOUNT**), set `deleteMissing` to `true` to delete all assets starting with `de_`, `cs_`, `dz_`, `ar_`, `coop_`, or `gd_` which have not been updated.

You can get your token easily by opening the Discord developer panel (`CTRL + SHIFT + I` in Discord) and copy-paste the following text into the console:

```js
var req=webpackJsonp.push([[],{extra_id:(e,r,t)=>e.exports=t},[["extra_id"]]]);for(let e in req.c)if(req.c.hasOwnProperty(e)){let r=req.c[e].exports;if(r&&r.__esModule&&r.default)for(let e in r.default)"getToken"===e&&console.log(r.default.getToken())}
```

**AGAIN: NEVER SHARE THIS TOKEN WITH ANYONE - IT GRANTS FULL ACCESS TO YOUR DISCORD ACCOUNT**

## Errors

You might get an error saying `HTTPError: Response code 404 (Not Found)` this is because Discord doesn't instantly update assets for everyone. It might take up to an hour for assets to be updated for everyone. I recommend not running this several times within an hour.
