<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class HomeController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the application dashboard.
	 * ログイン入力フォーム画面とログイン後画面になっている。
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index()
    {
        // ログアウトになっていたらログイン画面にリダイレクト
        if(\Auth::id() == null){
            return redirect('login');
        }
        
        return view('home');
    }
}
