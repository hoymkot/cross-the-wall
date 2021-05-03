'use strict';

exports.main_handler = async (event, context,callback ) => {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: JSON.stringify(event)
  }
}
