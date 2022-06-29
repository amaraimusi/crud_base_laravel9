<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/', function () {
//     return view('welcome');
// });

    

Route::get('/', 'App\Http\Controllers\DashboardController@index');


Route::post('ajax_login_with_cake/login_check', 'App\Http\Controllers\AjaxLoginWithCakeController@login_check');
Route::get('ajax_login_with_cake/login_rap', 'App\Http\Controllers\AjaxLoginWithCakeController@login_rap');
Route::get('ajax_login_with_cake/logout', 'App\Http\Controllers\AjaxLoginWithCakeController@logout');

Route::get('dashboard', 'App\Http\Controllers\DashboardController@index');

// Neko
Route::get('neko', 'App\Http\Controllers\NekoController@index');
Route::post('neko/ajax_reg', 'App\Http\Controllers\NekoController@ajax_reg');
Route::post('neko/ajax_delete', 'App\Http\Controllers\NekoController@ajax_delete');
Route::post('neko/auto_save', 'App\Http\Controllers\NekoController@auto_save');
Route::post('neko/ajax_pwms', 'App\Http\Controllers\NekoController@ajax_pwms');
Route::get('neko/csv_download', 'App\Http\Controllers\NekoController@csv_download');
Route::post('neko/bulk_reg', 'App\Http\Controllers\NekoController@bulk_reg');

// UserMng
Route::get('user_mng', 'App\Http\Controllers\UserMngController@index');
Route::post('user_mng/ajax_reg', 'App\Http\Controllers\UserMngController@ajax_reg');
Route::post('user_mng/ajax_delete', 'App\Http\Controllers\UserMngController@ajax_delete');
Route::post('user_mng/auto_save', 'App\Http\Controllers\UserMngController@auto_save');
Route::post('user_mng/ajax_pwms', 'App\Http\Controllers\UserMngController@ajax_pwms');
Route::get('user_mng/csv_download', 'App\Http\Controllers\UserMngController@csv_download');
Route::post('user_mng/bulk_reg', 'App\Http\Controllers\UserMngController@bulk_reg');

// MsgBoard
Route::get('msg_board', 'App\Http\Controllers\MsgBoardController@index');
Route::post('msg_board/ajax_reg', 'App\Http\Controllers\MsgBoardController@ajax_reg');
Route::post('msg_board/ajax_delete', 'App\Http\Controllers\MsgBoardController@ajax_delete');
Route::post('msg_board/auto_save', 'App\Http\Controllers\MsgBoardController@auto_save');
Route::post('msg_board/ajax_pwms', 'App\Http\Controllers\MsgBoardController@ajax_pwms');
Route::get('msg_board/csv_download', 'App\Http\Controllers\MsgBoardController@csv_download');
Route::post('msg_board/bulk_reg', 'App\Http\Controllers\MsgBoardController@bulk_reg');

// MsgBoardUserEval
Route::get('msg_board_user_eval', 'App\Http\Controllers\MsgBoardUserEvalController@index');
Route::post('msg_board_user_eval/ajax_reg', 'App\Http\Controllers\MsgBoardUserEvalController@ajax_reg');
Route::post('msg_board_user_eval/ajax_delete', 'App\Http\Controllers\MsgBoardUserEvalController@ajax_delete');
Route::post('msg_board_user_eval/auto_save', 'App\Http\Controllers\MsgBoardUserEvalController@auto_save');
Route::post('msg_board_user_eval/ajax_pwms', 'App\Http\Controllers\MsgBoardUserEvalController@ajax_pwms');
Route::get('msg_board_user_eval/csv_download', 'App\Http\Controllers\MsgBoardUserEvalController@csv_download');
Route::post('msg_board_user_eval/bulk_reg', 'App\Http\Controllers\MsgBoardUserEvalController@bulk_reg');

// MsgBoardEvalType
Route::get('msg_board_eval_type', 'App\Http\Controllers\MsgBoardEvalTypeController@index');
Route::post('msg_board_eval_type/ajax_reg', 'App\Http\Controllers\MsgBoardEvalTypeController@ajax_reg');
Route::post('msg_board_eval_type/ajax_delete', 'App\Http\Controllers\MsgBoardEvalTypeController@ajax_delete');
Route::post('msg_board_eval_type/auto_save', 'App\Http\Controllers\MsgBoardEvalTypeController@auto_save');
Route::post('msg_board_eval_type/ajax_pwms', 'App\Http\Controllers\MsgBoardEvalTypeController@ajax_pwms');
Route::get('msg_board_eval_type/csv_download', 'App\Http\Controllers\MsgBoardEvalTypeController@csv_download');
Route::post('msg_board_eval_type/bulk_reg', 'App\Http\Controllers\MsgBoardEvalTypeController@bulk_reg');

// ChangePw
Route::get('change_pw', 'App\Http\Controllers\ChangePwController@index');
Route::post('change_pw/ajax_reg', 'App\Http\Controllers\ChangePwController@ajax_reg');

// Web API
Route::get('web_api/cors_test', 'App\Http\Controllers\WebApiController@cors_test');


Auth::routes();

Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
    