const handleValidationErrors = (err) => {
    debugger
    if (err.response != null && err.response.data != null) {
      err = err.response.data
    }
    if (typeof err == 'object') {
      let errors = ""
      if (err.message != null) {
        return err.message
      }
      if (err.error != null) {
        errors = Object.keys(err.error).map(key => {
          const obj = err.error[key].pop()
          return key +": "+obj
        }).join("\n")
      } else if (err.message) {
        errors = err.message
      }
      return errors
    }
    return JSON.stringify(err)
  }
  export {
    handleValidationErrors, 
  }
  