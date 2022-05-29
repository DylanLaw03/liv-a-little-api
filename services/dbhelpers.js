
// get max post id
module.exports{
const getMaxPost = async(db) => {
    const query = "SELECT MAX(postid) from posttbl";
  
    const result = await db.query(query);
  
    return result.rows;
}
  
  
  // getPostBody
const getPostBody = async(db, lowerBound, upperBound) => {
    // query lower bound to upper bound for post body
    const result = await db.query(`SELECT * FROM posttbl WHERE postid >= ${lowerBound} and postid < ${upperBound}`);
  
  
    
    return result.rows;
}
  
const getPostImages = async(db, lowerBound, upperBound) => {
    // create query and param
    const query = "SELECT * FROM postimages WHERE postid >= $1 and postid < $2";
    const values = [lowerBound, upperBound];
    
    // query lower bound to upper bound for post images
    const result = await db.query(query, values);
  
  
    return result.rows;
}
  
  // function to retrieve posts,
  // returns result rows
const getPosts = async (db, lowerBound, upperBound) => {
    // query lower bound to upper bound for post body
    const postResult = await getPostBody(db, lowerBound, upperBound);
  
    let posts = postResult;
  
    // get id of last post to know which images need to be searched for, update upperBound
    upperBound = posts[posts.length - 1].postid + 1;
  
    const imageResult = await getPostImages(db, lowerBound, upperBound);
  
  
    // now add image links to posts
    for (let i = 0; i < posts.length; i++) {
      posts[i]["imageurl"] = imageResult[i].imageurl;
    }
  
  
    return posts;
}
  
  // function to upload post text
const uploadPost = async (db, postBody, postImg) => {
  
  
    //insert Post body, return postID
    let result = await db.query(`INSERT INTO postTbl (postBody) VALUES ('${postBody}') RETURNING postID`);
  
    // save post id
    const postId = (result.rows[0].postid);
    // upload image
    let cloudinaryResponse = await cloudinary.uploader.upload(postImg, 
    // set dir
    {folder: "post-images"},
    // handle any errors 
    function(error) {
      // send non 200 code back if there was an issue uploading
      if (error != undefined) {
        console.log(error);
        return 1;
      }
    });
  
    // if it all works, upload image url to DB
    result = await db.query(`INSERT INTO postImages (postid, imageURL) VALUES ('${postId}', '${cloudinaryResponse.url}')`);
  
    // return 0 if no errors
    return 0;
};
}