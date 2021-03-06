<?php

/**
 * Finds images from a give URL.
 *
 * @author   Torleif Berger
 * @link     http://www.geekality.net/?p=1585
 * @license  http://creativecommons.org/licenses/by/3.0/
 */
class ImageFinder
{
        private $document;
        private $url;
        private $base;
        private $imgNames;
        private $inclusiveKeys;
        private $exclusiveKeys;


        /**
         * Creates a new image finder object.
         */
        public function __construct($url)
        {
                // Store url
                $this->url = $url;
                $this->imgNames = array("data-gif", "data-url","data-echo","src");
                $this->inclusiveKeys = array(".gif");
                $this->exclusiveKeys = array("user", "smile");
        }


        /**
         * Loads the HTML from the url if not already done.
         */
        public function load()
        {
                // Return if already loaded
                if($this->document)
                        return;
                
                // Get the HTML document
                $this->document = self::get_document($this->url);
                
                //$this->document = self::login();

                // Get the base url
                $this->base = self::get_base($this->document);
                if( ! $this->base)
                        $this->base = $this->url;
        }

        public function fetchGIF() {
         
        	if($this->endsWith($this->url, '.jpg')) {
        		$images[0] = array
        		(
        			'src' => $this->url,
        		);
        	
        		$result = array('images' => $images, 'title' => '');
        		echo json_encode($result);
        	}else if($this->isWebsiteOf($this->url, '.weibo.')) {
            	$path = '/opt/phantomjs/';
                $result = exec($path.'bin/phantomjs '.dirname(__FILE__).'/weibo.js '.$this->url);
                echo $result;
            }else {
                $images = $this->get_images();
                $title = $this->get_title();
        
                // Output result
                $result = array('images' => $images, 'title' => $title);                
                echo json_encode($result);    
            }
        }

        public function get_title()
        {        	
            $nodes = $this->document->getElementsByTagName('title');            
            if(!$nodes || !$nodes->item(0)){
                return "";
            }else{
            	$title = $nodes->item(0)->nodeValue;
                return $title;
            }            
        } 
        /**
         * Returns an array with all the images found.
         */
        public function get_images()
        {
                // Makes sure we're loaded
                $this->load();

                // Image collection array
                $images = array();                
                
                // For hupu.com and others
                if($this->isWebsiteOf($this->url, '163.com')) {
                	$this->getImageFor163($images);
//                 }else if ($this->isWebsiteOf($this->url, 'm.hupu.com')) {
//                		$this->getImageForHupuMobile($images);
               	}else if ($this->isWebsiteOf($this->url, 'hupu.com')){
               		$this->getImageForHupu($images);
               	}else if($this->isWebsiteOf($this->url, 'm.pstatp.com')){
                    $this->getImageForToutiao($images);
                }else if($this->isWebsiteOf($this->url, 'baidu.com')) {
                    $this->getImageForBaidu($images);
                }else{
               		$this->getImageForOthers($images);
               	}         	               

                // Return values
                return array_values($images);
        }
        
        private function startsWith($haystack, $needle)
        {
        	$length = strlen($needle);
        	return (substr($haystack, 0, $length) === $needle);
        }
        
        private function endsWith($haystack, $needle)
        {
        	$length = strlen($needle);
        	if ($length == 0) {
        		return true;
        	}
        
        	return (substr($haystack, -$length) === $needle);
        }
        
        private function isWebsiteOf($url, $key) {
        	if(stripos($url, $key) === FALSE) {
        		return false;
        	}
        	return true;
        }

        private function getImageForBaidu(&$images) {
            foreach($this->document->getElementsByTagName('img') as $img)
            {
                 
                $src = $img->getAttribute('data-src')? $img->getAttribute('data-src'): $img->getAttribute('src');
        
                // if(stripos($src, 'large') === FALSE) {
                //     continue;
                // }
                 
                // Extract what we want
                $image = array
                (
                    'src' => self::make_absolute($src, $this->base),
                );
                 
                // Skip images without src
                if( ! $image['src'])
                    continue;
                 
                // Add to collection. Use src as key to prevent duplicates.
                $images[$image['src']] = $image;
            }
        }

        private function getImageForToutiao(&$images) {
            foreach($this->document->getElementsByTagName('img') as $img)
            {
                 
                $src = $img->getAttribute('data-src')? $img->getAttribute('data-src'): $img->getAttribute('src');
        
                if(stripos($src, 'large') === FALSE) {
                    continue;
                }
                 
                // Extract what we want
                $image = array
                (
                    'src' => self::make_absolute($src, $this->base),
                );
                 
                // Skip images without src
                if( ! $image['src'])
                    continue;
                 
                // Add to collection. Use src as key to prevent duplicates.
                $images[$image['src']] = $image;
            }
        }
        
        private function getImageForOthers(&$images) {
        	foreach($this->document->getElementsByTagName('img') as $img)
        	{
        		 
        		$src = $img->getAttribute('data-src')? $img->getAttribute('data-src'): $img->getAttribute('src');
        
        		if(stripos($src, 'gif') === FALSE) {
        			continue;
        		}
        		 
        		// Extract what we want
        		$image = array
        		(
        			'src' => self::make_absolute($src, $this->base),
        		);
        		 
        		// Skip images without src
        		if( ! $image['src'])
        			continue;
        		 
        		// Add to collection. Use src as key to prevent duplicates.
        		$images[$image['src']] = $image;
        	}
        }
        
//         private function getImageForHupuMobile(&$images) {
//         	foreach($this->document->getElementsByTagName('a') as $img)
//         	{
//         		$src = $img->getAttribute('data-echo')? $img->getAttribute('data-echo'): $img->getAttribute('src');
//         		$src = $img->getAttribute('href');
        
//         		if(stripos($src, '.gif') === FALSE) {
//         			continue;
//         		}
        
//         		// Extract what we want
//         		$image = array
//         		(
//         				'src' => self::make_absolute($src, $this->base),
//         		);
        
//         		// Skip images without src
//         		if( ! $image['src'])
//         			continue;
        
//         		// Add to collection. Use src as key to prevent duplicates.
//         		$images[$image['src']] = $image;
//         	}
//         }
        
        private function getImageForHupu(&$images) {
        	foreach($this->document->getElementsByTagName('img') as $img)
        	{      
				$src = $this->getURLFromImg($img);
				
				if(!$this->filterURL($src)) continue;
        	
        		// Extract what we want
        		$image = array
        		(
        			'src' => self::make_absolute($src, $this->base),
        		);
        	
        		// Skip images without src
        		if( ! $image['src'])
        			continue;
        	
        		// Add to collection. Use src as key to prevent duplicates.
        		$images[$image['src']] = $image;
        	}
        }
        
        private function getImageFor163(&$images) {
        	foreach($this->document->getElementsByTagName('img') as $img)
        	{
        		 
        		$src = $img->getAttribute('data-echo')? $img->getAttribute('data-echo'): $img->getAttribute('src');
        		
        		if(stripos($src, '.gif') === FALSE) {
        			continue;
        		}
        		 
        		// Extract what we want
        		$image = array
        		(
        			'src' => self::make_absolute($src, $this->base),
        		);
        		 
        		// Skip images without src
        		if( ! $image['src'])
        			continue;
        		 
        		// Add to collection. Use src as key to prevent duplicates.
        		$images[$image['src']] = $image;
        	}
        }              
        
        private function getURLFromImg($img) {
        	        	
        	foreach($this->imgNames as $name) {        	
        		$value = $img->getAttribute($name);
        		if($value) {
        			if($this->startsWith($value, "//")) {
        				return "http:" . $value; 
        			}
        			return $value;
        		}
        	}
        	return null;   	     
        }
        
        private function filterURL($url) {
        	
        	foreach($this->inclusiveKeys as $key) {        		
        		if(stripos($url, $key) === FALSE) {
        			return false;
        		}
        	}
        	
        	foreach($this->exclusiveKeys as $key) {
        		if(stripos($url, $key) !== FALSE) {
        			return false;
        		}
        	}
        	
        	return true;
        }
        
        /**
         * Gets the html of a url and loads it up in a DOMDocument.
         */
        private static function get_document($url)
        {
        	$cookie_jar = dirname(__FILE__)."/cookie.txt";
        	                	
                // Set up and execute a request for the HTML
                $request = curl_init();
                curl_setopt_array($request, array
                (
                        CURLOPT_URL => $url,
                        
                        CURLOPT_RETURNTRANSFER => TRUE,
                        CURLOPT_HEADER => FALSE,
//                         CURLOPT_SSL_VERIFYPEER => FALSE,
//                         CURLOPT_SSL_VERIFYHOST => FALSE,                       
                        
                        CURLOPT_SSL_VERIFYPEER => TRUE,
                        CURLOPT_CAINFO => dirname(__FILE__).'/cacert.pem',

                        CURLOPT_FOLLOWLOCATION => TRUE,
                        CURLOPT_MAXREDIRS => 10,
                ));
                
                curl_setopt($request, CURLOPT_COOKIEFILE, $cookie_jar);
                //curl_setopt($request, CURLOPT_COOKIEJAR, "cookies.txt");
                
                $response = curl_exec($request);
//                 $err = curl_error($request);
//                 print_r($err);
//                 print_r($response);
                curl_close($request);

                // Create DOM document
                $document = new DOMDocument();

                // Load response into document, if we got any
                if($response)
                {
                        libxml_use_internal_errors(true);
//                         $searchPage = mb_convert_encoding($response, 'HTML-ENTITIES', "gb2312");                        
                        $response = '<meta http-equiv="Content-Type" content="text/html;charset=utf-8">' . $response;
                        $document->loadHTML($response);
                       	//print_r($document->saveHTML());
                        libxml_clear_errors();
                }
                           
                return $document;
        }
                       
        private static function login() {
        	
        	$cookie_jar = dirname(__FILE__)."/cookie.txt";
        	        	 
        	$ch = curl_init('http://passport.hupu.com/pc/login/member.action');
        	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        	curl_setopt($ch, CURLOPT_POSTFIELDS, "username=18621603725&password=5c008ee4275971386d4aa5ac38d92bbe");
        	curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);        	         	
        	 
        	$headers = array(
        			"Content-type: application/x-www-form-urlencoded; charset=UTF-8",
        			"Accept: application/json, text/javascript, */*; q=0.01",
        			"Origin: http://passport.hupu.com",
        			"X-Requested-With: XMLHttpRequest",
        			"Accept-Encoding: gzip, deflate",
        			"Accept-Language: zh-CN,zh;q=0.8,en;q=0.6",
        			"Cache-Control: no-cache",
        			"Connection: keep-alive",
        			"Pragma: no-cache",
        			"Referer: http://passport.hupu.com/pc/login?project=bbs&from=pc",
        			"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36"
        	);        	 
        	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        	         	
        	//curl_setopt($ch, CURLOPT_COOKIEFILE, "cookies.txt");
        	curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie_jar);                	
        	         	 
        	$result = curl_exec($ch);     	  
        	        	 
        	curl_close($ch);        	         	        	         
        }


        /**
         * Tries to get the base tag href from the given document.
         */
        private static function get_base(DOMDocument $document)
        {
                $tags = $document->getElementsByTagName('base');

                foreach($tags as $tag)
                        return $tag->getAttribute('href');

                return NULL;
        }


        /**
         * Makes sure a url is absolute.
         */
        private static function make_absolute($url, $base) 
        {
                // Return base if no url
                if( ! $url) return $base;

                // Already absolute URL
                if(parse_url($url, PHP_URL_SCHEME) != '') return $url;
                
                // Only containing query or anchor
                if($url[0] == '#' || $url[0] == '?') return $base.$url;
                
                // Parse base URL and convert to local variables: $scheme, $host, $path
                extract(parse_url($base));

                // If no path, use /
                if( ! isset($path)) $path = '/';
         
                // Remove non-directory element from path
                $path = preg_replace('#/[^/]*$#', '', $path);
         
                // Destroy path if relative url points to root
                if($url[0] == '/') $path = '';
                
                // Dirty absolute URL
                $abs = "$host$path/$url";
         
                // Replace '//' or '/./' or '/foo/../' with '/'
                $re = array('#(/\.?/)#', '#/(?!\.\.)[^/]+/\.\./#');
                for($n = 1; $n > 0; $abs = preg_replace($re, '/', $abs, -1, $n)) {}
                
                // Absolute URL is ready!
                return $scheme.'://'.$abs;
        }
}