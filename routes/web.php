<?php

use App\Http\Controllers\AskController;
use App\Http\Controllers\BriefController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\JobMatchController;
use App\Http\Controllers\LabController;
use App\Http\Controllers\ResumeController;
use App\Http\Controllers\ServicesController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\WorkController;
use Illuminate\Support\Facades\Route;

Route::get('/', HomeController::class)->name('home');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');
Route::get('/services', ServicesController::class)->name('services');
Route::post('/services/brief', BriefController::class)->middleware('throttle:brief')->name('services.brief');
Route::permanentRedirect('/hire', '/services');
Route::get('/resume', ResumeController::class)->name('resume');
Route::post('/resume/match', JobMatchController::class)->middleware('throttle:job-match')->name('resume.match');
Route::get('/work', [WorkController::class, 'index'])->name('work.index');
Route::get('/work/{slug}', [WorkController::class, 'show'])->where('slug', '[a-z0-9-]+')->name('work.show');

Route::post('/ask', AskController::class)->middleware('throttle:ask')->name('ask');

Route::get('/ai-lab', [LabController::class, 'show'])->name('lab');
Route::post('/ai-lab/chat', [LabController::class, 'chat'])->middleware('throttle:lab')->name('lab.chat');

Route::get('/contact', [ContactController::class, 'show'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:contact')->name('contact.store');
