'use strict';
const axios = require('axios');
const semver = require('semver')

function getNpmInfo(npmName, registry) {
  if (!npmName) {
    return null;
  }  
  const registryUrl = registry || getDefaultRegistry(registry);
  const npmInfoUrl = `${registryUrl}/${npmName}`;
  return axios.get(npmInfoUrl).then(function(res) {
    if (res.status === 200) {
        return res.data;
    } else {
        return null;
    }
  }).catch(error => Promise.reject(error))
}



function getDefaultRegistry(isOrigin) {
    return isOrigin ? 'http://registry.npmjs.org' : 'http://registry.npm.taobao.org';
}



function getNpmVersion(data) {
  if (data) {
      return data.versions && Object.keys(data.versions);
  }
  return null;
}



function getSemverVersion(baseVersion, version) {
    return version.filter(item => semver.lt(baseVersion, `${item}`));
}



async function checkVersionUpdate(baseVersion, npmName, registry) {
   if (baseVersion && npmName) {
    const data = await getNpmInfo(npmName, registry);
    const allVersion = getNpmVersion(data);
    if ( allVersion) {
        return  getSemverVersion(baseVersion, allVersion);
    }
   } 
   return null;
}


module.exports = {
    getNpmInfo,
    getNpmVersion,
    checkVersionUpdate
};
