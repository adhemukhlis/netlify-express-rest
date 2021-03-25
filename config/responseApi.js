/**
 * @desc    Send any success response
 *
 * @param   {string} message
 * @param   {object | array} data
 * @param   {number} statusCode
 */
exports.success = ( message, data, statusCode ) => {
	return { message, status: "success", code: statusCode, data };
};

/**
   * @desc    Send any error response
   *
   * @param   {string} message
   * @param   {number} statusCode
   */
exports.error = ( message, statusCode ) => {
	// List of common HTTP request code
	const codes = [
		200,
		201,
		400,
		401,
		404,
		403,
		422,
		500
	];

	// Get matched code
	const findCode = codes.find( ( code ) => code == statusCode );

	if ( !findCode ) {
		statusCode = 500;
	} else {
		statusCode = findCode;
	}

	return { message, code: statusCode, status: 'error' };
};

/**
   * @desc    Send any validation response
   *
   * @param   {object | array} errors
   */
exports.validation = ( errors ) => {
	return { message: "Validation errors", error: true, code: 422, errors };
};