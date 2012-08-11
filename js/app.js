/*Start your appication by calling the Em.Application Object*/
var App = Em.Application.create({
	accessToken:window.location.hash.split('=')[1],
	clientId:"9efddfdec04a474f884d14f56cb287a5",
	ready: function(){ 	/* Executes when the DOM is ready */
		App.wallController = App.WallController.create();
		App.appManager = Em.StateManager.create({ /* State Manager is created */
			start:Em.State.create({
				initialState: 'fetching',
				fetching:Em.State.create({
					enter:function(manager,context){
						App.userController.getUser();
						App.popularController.refill();
					}
				}),
				userRender:function(manager,obj){
					App.userModel.set('content',obj.data);
				},
				wallRender:function(){
					var popView = App.PopView.create({
						templateName:"pop-tmpl",
						content: App.popularController.content
					}).appendTo('.container-fluid');
					App.popularController.content.setEach('rendered','true');
				}
			}),
			initFinish : Em.State.create({
				enter:function(){
					$('button').removeClass('hidden');
					$('#fetching-msg').fadeOut('800');
					$('.container-fluid').css({'display':'none','opacity':'1'}).fadeIn('800');
				},
				add:function(){
					$('button').html('Fetching..');
					App.popularController.refill();
				},
				wallRender:function(){
					$('button').html('Add More Pictures!');
					var listView = Em.View.create({
						templateName:"pop-list-tmpl",
						content: App.popularController.content
					}).appendTo('#photo-list');
					$('#photo-list').imagesLoaded(function(){
						console.log('loaded');
						$('#photo-list').masonry('reload');
						setTimeout(function(){
							$('#photo-list').masonry('reload');
						},700);
					});
					App.popularController.content.setEach('rendered','true');

				}
			})

			
		});
	}
});






/* Controller is created from the Em.Object */
App.WallController = Em.Object.extend({
	ele: '#photo-list',
	inits: function(){ /* Cannot call "init", because it will automatically execute when a instances of WallController is executed. Which in this case is not advisable because the HTML is not yet inserted when DOM is ready.*/
		$(this.ele).on('mouseover','li',function(){
			// console.log('in');
			$(this).find('span').stop(true,true).fadeIn('500');
		});
		$(this.ele).on('mouseout','li',function(){
			// console.log('out');
			$(this).find('span').stop(true,true).fadeOut('500');
		});
		if(this.ele !== 'undefined'){
			var $ele = $(this.ele);
			$ele.imagesLoaded(function(){
				$ele.masonry({
					itemSelector: '.item',
					columnWidth: 310,
					isAnimated: true
				});
				App.appManager.transitionTo('initFinish');
			});
		}
		
	},
	add: function(){
		App.appManager.send('add');
	}
});

App.userModel = Em.Object.create({
	content: ""
});

App.userController = Em.Object.create({
	contentBinding: 'App.userModel.content',
	getUser:function(){
		$.getJSON('https://api.instagram.com/v1/users/self/?access_token='+App.accessToken+'&callback=?',function(obj){
			console.log(obj);
			if(obj.meta.code === 400){
				window.location = "https://instagram.com/oauth/authorize/?client_id="+App.clientId+"&redirect_uri=http://localhost/instaember&response_type=token";
			} else {
				console.log('User fetched');
				App.appManager.send('userRender',obj);
			}
		});

		
	}
});

// By adding the word "Binding" behind "content", we are binding the userController.content to UserView.content
App.UserView = Em.View.extend({
	contentBinding:"App.userController.content"
});

App.popularController = Em.ArrayController.create({
	content:[],
	refill: function(){
		var that = this;
		$.getJSON('https://api.instagram.com/v1/media/popular?access_token='+App.accessToken+'&callback=?',function(obj){
			console.log('Picture fetched');
			
			if(!that.get('content').length){
				obj.data.forEach(function(item,index){
					if(item.likes.count > 5000){
						item.imgWidth = true;
					}
					that.addObject(item);
				});
			} else{
				var existingArr = that.get('content');
				obj.data = obj.data.without(existingArr);
				obj.data.forEach(function(item){
					var existBool = existingArr.find(function(item1){
						return item1.id ==item.id;
					});
					if(!existBool){
						if(item.likes.count > 5000){
							item.imgWidth = true;
						}
						that.addObject(item);
					}
				});


			}

			App.appManager.send('wallRender');
		});
	}
});

	App.PopView = Em.View.extend({
		content: [],
		didInsertElement:function(){
			console.log('inserted');
			App.wallController.inits();
		}
	});
