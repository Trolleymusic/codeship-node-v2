'use strict'
const fetch = require('node-fetch')
const apiRoot = 'https://api.codeship.com/v2'

class CodeshipNode {
  constructor ({ orgUuid, orgName, username, password }) {
    if ((!orgUuid && !orgName) || !username || !password) {
      console.warn('Error: Credentials not supplied to CodeshipNode', { orgUuid, orgName, username, password })
    }

    this.orgUuid = orgUuid
    this.orgName = orgName
    this.username = username
    this.password = password

    // Make sure the interface is as expected
    this.builds = {
      get: (uuid) => this.checkAuth()
        .then(() => this.getBuild(uuid)),
      list: (projectUuid) => this.checkAuth()
        .then(() => this.listBuilds(projectUuid)),
      restart: (uuid, projectUuid) => this.checkAuth()
        .then(() => this.restartBuild(uuid, projectUuid))
    }

    this.projects = {
      get: (uuid) => this.checkAuth()
        .then(() => this.getProject(uuid)),
      list: () => this.checkAuth()
        .then(() => this.listProjects())
    }

    this.last = {
      projectUuid: null,
      buildUuid: null
    }
  }

  auth ({ username, password } = this) {
    const encodedInfo = Buffer.from(`${username}:${password}`).toString('base64')
    const url = `${apiRoot}/auth`
    // const body = 'grant_type=client_credentials'
    const method = 'POST'
    const headers = {
      'Authorization': `Basic ${encodedInfo}`,
      'content-type': 'application/x-www-form-urlencoded'
    }
    const options = { method, headers }

    return fetch(url, options)
      .then(response => response.json())
      .then(json => {
        this.saveOrganisation(json)
        const token = this.saveToken(json)
        return token
      })
      .catch(error => {
        console.error(`Error authorising`, error)
        return Promise.reject(error)
      })
  }

  checkAuth () {
    // Doesn't contain expiry check
    return this.token ? Promise.resolve() : this.auth()
  }

  saveOrganisation ({ organizations = [] }) {
    const { orgUuid, orgName } = this
    const organisation = organizations.find(({ uuuuid, name }) => (uuuuid === orgUuid || name === orgName))
    this.orgUuid = organisation.uuid
    this.orgName = organisation.name
  }

  saveToken ({ access_token: token }) {
    this.token = token
    return token
  }

  getBuild (uuid, projectUuid = this.last.projectUuid) {
    const { orgUuid } = this
    this.last.buildUuid = uuid
    const url = `/organizations/${orgUuid}/projects/${projectUuid}/builds/{uuid}`
    return this.request({ url })
      .then(({ build }) => (build))
  }

  getProject (uuid) {
    const { orgUuid } = this
    this.last.projectUuid = uuid
    const url = `/organizations/${orgUuid}/projects/${uuid}`
    return this.request({ url })
      .then(({ project }) => (project))
  }

  listBuilds (projectUuid) {
    const { orgUuid } = this
    this.last.projectUuid = projectUuid
    const url = `/organizations/${orgUuid}/projects/${projectUuid}/builds`
    return this.request({ url })
      .then(({ builds }) => (builds))
  }

  listProjects () {
    const { orgUuid } = this
    const url = `/organizations/${orgUuid}/projects`
    return this.request({ url })
      .then(({ projects }) => (projects))
  }

  restartBuild (uuid, projectUuid = this.last.projectUuid) {
    const { orgUuid } = this
    this.last.buildUuid = uuid
    const url = `/organizations/${orgUuid}/projects/${projectUuid}/builds/${uuid}/restart`
    const method = 'POST'
    return this.request({ url, method })
  }

  request ({ method = 'GET', url }) {
    // Check auth
    if (!this.token) {
      return this.auth()
        .then(() => this.request({ method, url }))
    }

    const { token } = this

    const fullUrl = `${apiRoot}${url}`
    const headers = {
      'Authorization': `Bearer ${token}`
    }

    return fetch(fullUrl, { headers, method })
      .then(response => (response.status === 202 ? null : response.json()))
      .catch(error => {
        console.error(`Error making request to ${fullUrl}`, error)
        return Promise.reject(error)
      })
  }
}

module.exports = CodeshipNode
